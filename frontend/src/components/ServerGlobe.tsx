import { useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

export interface ServerNode {
  id: string
  name: string
  lat: number
  lng: number
  status: 'online' | 'warning' | 'offline'
  region: string
}

export interface NetworkArc {
  id: string
  fromNodeId: string
  toNodeId: string
  bandwidthGbps: number
}

interface ServerGlobeProps {
  nodes?: ServerNode[]
  arcs?: NetworkArc[]
  selectedNodeId?: string
  countryCode?: string
  onNodeSelect?: (node: ServerNode) => void
}

const bordersUrl = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
const adminDivisionsUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson'
const peruDepartmentsUrl = 'https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson'
const unitedStatesStatesUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
const modes = [
  { label: '3D', mode: Cesium.SceneMode.SCENE3D },
  { label: '2D', mode: Cesium.SceneMode.SCENE2D },
  { label: '2.5D', mode: Cesium.SceneMode.COLUMBUS_VIEW },
]

// Follow the shortest geodesic, including connections across the date line.
function arcPositions(from: ServerNode, to: ServerNode): Cesium.Cartesian3[] {
  const geodesic = new Cesium.EllipsoidGeodesic(
    Cesium.Cartographic.fromDegrees(from.lng, from.lat),
    Cesium.Cartographic.fromDegrees(to.lng, to.lat),
  )
  const peak = Cesium.Math.clamp(geodesic.surfaceDistance * 0.12, 500_000, 1_000_000)
  return Array.from({ length: 65 }, (_, index) => {
    const t = index / 64
    const position = geodesic.interpolateUsingFraction(t)
    return Cesium.Cartesian3.fromRadians(position.longitude, position.latitude, 4 * peak * t * (1 - t) + 15_000)
  })
}

function flyToNode(viewer: Cesium.Viewer, node: ServerNode) {
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(node.lng, node.lat, 3_000_000), duration: 1.4 })
}

export function ServerGlobe({ nodes: suppliedNodes, arcs: suppliedArcs, selectedNodeId, countryCode, onNodeSelect }: ServerGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const loadAdminRef = useRef<(() => void) | null>(null)
  const callbackRef = useRef(onNodeSelect)
  const [mode, setMode] = useState(Cesium.SceneMode.SCENE3D)
  const [error, setError] = useState('')
  const [borderError, setBorderError] = useState('')
  const [divisionLoading, setDivisionLoading] = useState(false)
  const [divisionError, setDivisionError] = useState('')
  const [selected, setSelected] = useState<ServerNode | null>(null)
  const nodes = useMemo(() => suppliedNodes ?? [], [suppliedNodes])
  const arcs = useMemo(() => suppliedArcs ?? [], [suppliedArcs])

  useEffect(() => { callbackRef.current = onNodeSelect }, [onNodeSelect])

  useEffect(() => {
    if (!containerRef.current) return
    let disposed = false
    let viewer: Cesium.Viewer
    try {
      viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false, animation: false, baseLayerPicker: false,
        geocoder: false, homeButton: false, sceneModePicker: false,
        navigationHelpButton: false, fullscreenButton: false,
        infoBox: false, selectionIndicator: false, baseLayer: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        requestRenderMode: true, maximumRenderTimeChange: Infinity,
      })
    } catch {
      // WebGL availability varies by device; keep the region console usable.
      queueMicrotask(() => { if (!disposed) setError('No se pudo iniciar el globo. Comprueba que WebGL esté habilitado en tu navegador.') })
      return () => { disposed = true }
    }
    viewerRef.current = viewer
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#141313')
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false
    viewer.scene.fog.enabled = false
    viewer.scene.globe.showGroundAtmosphere = false
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#2a2727')
    viewer.scene.globe.enableLighting = false
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-35, 15, 23_000_000) })
    const nodeByEntity = new Map<Cesium.Entity, ServerNode>()
    for (const node of nodes) {
      const entity = viewer.entities.add({
        id: `server-${node.id}`, name: node.name,
        position: Cesium.Cartesian3.fromDegrees(node.lng, node.lat, 15_000),
        point: { pixelSize: 11, color: Cesium.Color.fromCssColorString('#c9d8ba'), outlineColor: Cesium.Color.fromCssColorString('#9cad97').withAlpha(0.32), outlineWidth: 5 },
        label: { text: node.name, font: '12px sans-serif', fillColor: Cesium.Color.fromCssColorString('#c9d8ba'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -23), showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#141313').withAlpha(0.88),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 45_000_000) },
      })
      nodeByEntity.set(entity, node)
    }
    const byId = new Map(nodes.map((node) => [node.id, node]))
    for (const arc of arcs) {
      const from = byId.get(arc.fromNodeId)
      const to = byId.get(arc.toNodeId)
      if (!from || !to || (from.lat === to.lat && from.lng === to.lng)) continue
      viewer.entities.add({ id: `arc-${arc.id}`, name: `${from.name} → ${to.name} · ${arc.bandwidthGbps} Gbps`,
        polyline: { positions: arcPositions(from, to), width: 3, arcType: Cesium.ArcType.NONE,
          material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.18, color: Cesium.Color.fromCssColorString('#9cad97').withAlpha(0.8) }) } })
    }
    let borders: Cesium.GeoJsonDataSource | undefined
    let adminDivisions: Cesium.GeoJsonDataSource | undefined
    let adminLoading = false
    const borderStyle = {
      stroke: Cesium.Color.fromCssColorString('#d8d3d3').withAlpha(0.34), strokeWidth: 1,
      fill: Cesium.Color.TRANSPARENT, clampToGround: false,
    }
    void Cesium.GeoJsonDataSource.load(bordersUrl, borderStyle)
      .catch(() => {
        if (disposed) return undefined
        return Cesium.GeoJsonDataSource.load(`${import.meta.env.BASE_URL}world/world.geojson`, borderStyle)
      }).then(async (source) => {
      if (disposed || !source) return
      borders = source
      // Override simplestyle properties carried by the public file.
      for (const entity of source.entities.values) {
        if (entity.polygon) {
          // Rhumb-line subdivision is undefined at polar boundaries in this dataset.
          entity.polygon.arcType = new Cesium.ConstantProperty(Cesium.ArcType.GEODESIC)
          entity.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.TRANSPARENT)
          entity.polygon.outline = new Cesium.ConstantProperty(true)
          entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#d8d3d3').withAlpha(0.34))
        }
      }
      await viewer.dataSources.add(source)
      if (!disposed) viewer.scene.requestRender()
    }).catch(() => { if (!disposed) setBorderError('Las fronteras no están disponibles. Puedes seguir explorando los servidores.') })

    const loadAdminDivisions = () => {
      if (adminDivisions || adminLoading || disposed) return
      adminLoading = true
      setDivisionLoading(true)
      const adminStyle = {
        stroke: Cesium.Color.fromCssColorString('#9cad97').withAlpha(0.58),
        strokeWidth: 0.8,
        fill: Cesium.Color.TRANSPARENT,
        clampToGround: false,
      }
      const localAdminUrl = `${import.meta.env.BASE_URL}world/admin-1.geojson`
      const normalizedCountry = countryCode?.toUpperCase()
      const countryAdminUrl = normalizedCountry?.startsWith('PE-') || normalizedCountry === 'PE' ? peruDepartmentsUrl : normalizedCountry?.startsWith('US-') || normalizedCountry === 'US' ? unitedStatesStatesUrl : adminDivisionsUrl
      const loadGlobalFallback = () => Cesium.GeoJsonDataSource.load(adminDivisionsUrl, adminStyle)
      void Cesium.GeoJsonDataSource.load(localAdminUrl, adminStyle)
        .catch(() => Cesium.GeoJsonDataSource.load(countryAdminUrl, adminStyle).catch(loadGlobalFallback))
        .then(async (source) => {
          if (disposed || !source) return
          adminDivisions = source
          for (const entity of source.entities.values) {
            if (!entity.polygon) continue
            entity.polygon.arcType = new Cesium.ConstantProperty(Cesium.ArcType.GEODESIC)
            entity.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.TRANSPARENT)
            entity.polygon.outline = new Cesium.ConstantProperty(true)
            entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#9cad97').withAlpha(0.58))
          }
          await viewer.dataSources.add(source)
          source.show = viewer.camera.positionCartographic.height < 8_500_000
          viewer.scene.requestRender()
        })
        .catch(() => { if (!disposed) setDivisionError('Las divisiones administrativas no están disponibles en este momento.') })
        .finally(() => { if (!disposed) { adminLoading = false; setDivisionLoading(false) } })
    }

    loadAdminRef.current = loadAdminDivisions
    const updateAdminVisibility = () => {
      const shouldShow = viewer.camera.positionCartographic.height < 8_500_000
      if (adminDivisions) {
        adminDivisions.show = shouldShow
        if (shouldShow) viewer.scene.requestRender()
      } else if (shouldShow) {
        loadAdminDivisions()
      }
    }

    viewer.camera.changed.addEventListener(updateAdminVisibility)
    updateAdminVisibility()

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
      const picked: unknown = viewer.scene.pick(event.position)
      if (!picked || typeof picked !== 'object' || !('id' in picked) || !(picked.id instanceof Cesium.Entity)) return
      const entity = picked.id
      const node = nodeByEntity.get(entity)
      if (node) {
        setSelected(node)
        flyToNode(viewer, node)
        callbackRef.current?.(node)
      } else if (borders?.entities.contains(entity)) {
        const positions = entity.polygon?.hierarchy?.getValue(viewer.clock.currentTime)?.positions as Cesium.Cartesian3[] | undefined
        if (!positions?.length) return
        const center = Cesium.BoundingSphere.fromPoints(positions)
        const location = Cesium.Cartographic.fromCartesian(center.center)
        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromRadians(location.longitude, location.latitude,
          Math.max(2_000_000, center.radius * 3)), duration: 1.4 })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    const resize = new ResizeObserver(() => { if (!viewer.isDestroyed()) { viewer.resize(); viewer.scene.requestRender() } })
    resize.observe(containerRef.current)
    return () => {
      disposed = true
      loadAdminRef.current = null
      resize.disconnect()
      viewer.camera.changed.removeEventListener(updateAdminVisibility)
      handler.destroy()
      viewerRef.current = null
      if (!viewer.isDestroyed()) viewer.destroy()
    }
  }, [countryCode, nodes, arcs])

  useEffect(() => {
    const viewer = viewerRef.current
    const node = nodes.find((item) => item.id === selectedNodeId)
    if (viewer && node) {
      flyToNode(viewer, node)
      loadAdminRef.current?.()
    }
  }, [selectedNodeId, nodes])

  const changeMode = (next: Cesium.SceneMode) => {
    const viewer = viewerRef.current
    if (!viewer || viewer.scene.mode === Cesium.SceneMode.MORPHING) return
    if (next === Cesium.SceneMode.SCENE3D) viewer.scene.morphTo3D(1)
    if (next === Cesium.SceneMode.SCENE2D) viewer.scene.morphTo2D(1)
    if (next === Cesium.SceneMode.COLUMBUS_VIEW) viewer.scene.morphToColumbusView(1)
    setMode(next)
  }

  return <section className="server-globe-shell" aria-label="Mapa de ubicaciones cloud">
    <header className="server-globe-header">
      <div><h3>Mapa de ubicaciones</h3><p>Distribución geográfica de la propuesta seleccionada</p></div>
      <div className="server-globe-modes" aria-label="Modo del mapa">{modes.map((item) => <button key={item.mode} type="button" aria-pressed={mode === item.mode} onClick={() => changeMode(item.mode)} className={mode === item.mode ? 'is-active' : ''}>{item.label}</button>)}</div>
    </header>
    <div className="relative h-[420px] sm:h-[520px]">
      <div ref={containerRef} className="absolute inset-0" />
      {error && <div role="alert" className="server-globe-error">{error}</div>}
      {borderError && <p role="status" className="server-globe-border-error">{borderError}</p>}
      {divisionLoading && <p role="status" className="server-globe-division-status">Cargando divisiones administrativas…</p>}
      {divisionError && <p role="status" className="server-globe-division-error">{divisionError}</p>}
    </div>
    <footer className="server-globe-footer">
      <p>Arrastra para explorar, usa la rueda para acercar y selecciona una ubicación.</p>
      {selected && <p className="server-globe-selected">{selected.name} · {selected.region} · Ubicación seleccionada</p>}
      <div className="server-globe-node-list">{nodes.map((node) => <button key={node.id} type="button" onClick={() => {
        const viewer = viewerRef.current
        if (viewer) flyToNode(viewer, node)
        setSelected(node)
        callbackRef.current?.(node)
      }} className={node.id === selectedNodeId ? 'is-selected' : ''}>{node.name}</button>)}</div>
    </footer>
  </section>
}

export default ServerGlobe
