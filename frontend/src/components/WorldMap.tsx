import { useEffect, useState } from 'react'
import type { Region } from '../types/cloud'
import { Icon } from './Icon'

const W = 900
const LAT_MIN = -58
const LAT_MAX = 84
const R = W / (2 * Math.PI)
const toRad = (deg: number) => (deg * Math.PI) / 180

const millerY = (deg: number) => R * 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * toRad(deg)))

const H = Math.round(millerY(LAT_MAX) - millerY(LAT_MIN))

const project = (lng: number, lat: number): [number, number] => [((lng + 180) / 360) * W, millerY(LAT_MAX) - millerY(Math.min(lat, LAT_MAX))]

function ringToPath(ring: number[][]) {
  const pts: Array<[number, number]> = []
  for (const [lng, lat] of ring) pts.push(project(lng, lat))
  if (pts.length < 3) return ''
  const segments: Array<Array<[number, number]>> = []
  let segment = [pts[0]]
  for (let i = 1; i < pts.length; i += 1) {
    if (Math.abs(pts[i][0] - pts[i - 1][0]) > W / 2) {
      if (segment.length >= 2) segments.push(segment)
      segment = [pts[i]]
    } else {
      segment.push(pts[i])
    }
  }
  if (segment.length >= 2) segments.push(segment)
  return segments
    .map((points) => {
      let d = ''
      for (let i = 0; i < points.length; i += 1) {
        d += `${i === 0 ? 'M' : 'L'}${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`
      }
      return `${d}Z`
    })
    .join('')
}

function geometryToPath(geometry: { type: string; coordinates: unknown }) {
  const rings: number[][][] = []
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates as number[][][]) rings.push(ring)
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates as number[][][][]) {
      for (const ring of polygon) rings.push(ring)
    }
  }
  return rings.map(ringToPath).join('')
}

type GeoCollection = { type: string; features: Array<{ geometry: { type: string; coordinates: unknown } }> }

function markerStyle(region: Region): { left: string; top: string } {
  const [x, y] = project(region.lng, region.lat)
  return { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }
}

export function WorldMap({ regions, selectedCode, onSelect }: { regions: Region[]; selectedCode: string; onSelect: (code: string) => void }) {
  const [land, setLand] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}world/world.geojson`)
      .then((response) => response.json())
      .then((data: GeoCollection) => {
        if (cancelled) return
        setLand((data.features ?? []).map((feature) => geometryToPath(feature.geometry)).join(''))
      })
      .catch(() => {
        /* mantener el océano si no se pudo cargar el mapa */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold tracking-[-0.02em] text-slate-800">Mapa de regiones activas</h3><p className="mt-1 text-sm text-slate-500">Selecciona una ubicación para consultar su despliegue.</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Icon name="public" className="text-[15px]" />Cobertura global</span></div>
      <div className="relative w-full overflow-hidden bg-[var(--map-ocean-a)]" style={{ aspectRatio: `${W}/${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs><pattern id="mapGrid" width="45" height="45" patternUnits="userSpaceOnUse"><path d={`M45 0H0V45`} fill="none" stroke="var(--map-grid)" strokeWidth="1" /></pattern><linearGradient id="ocean" x1="0" x2="1" y1="0" y2="1"><stop stopColor="var(--map-ocean-a)" /><stop offset="1" stopColor="var(--map-ocean-b)" /></linearGradient></defs>
          <rect width={W} height={H} fill="url(#ocean)" /><rect width={W} height={H} fill="url(#mapGrid)" opacity=".18" />
          {land && <path d={land} fill="var(--map-land)" stroke="var(--map-land-stroke)" strokeWidth={1} strokeLinejoin="round" />}
        </svg>
        {regions.map((region) => {
          const selected = region.code === selectedCode
          return <button type="button" key={region.code} onClick={() => onSelect(region.code)} style={markerStyle(region)} aria-label={`Seleccionar región ${region.name}`} className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"><span className={`absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/15 ${selected ? 'animate-ping' : 'opacity-0 group-hover:opacity-100'}`} /><span className={`relative flex size-8 items-center justify-center rounded-full border-[3px] border-white shadow-lg transition dark:border-[#0d1729] ${selected ? 'scale-110 bg-blue-600 text-white ring-4 ring-blue-200' : region.tone === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white group-hover:bg-blue-600 dark:bg-slate-600 dark:text-[#0f172a]'}`}><span className="text-[15px]">{region.flag}</span></span><span className={`absolute left-1/2 top-10 w-max -translate-x-1/2 rounded-lg border bg-white px-2.5 py-1.5 text-center shadow-md transition ${selected ? 'border-blue-200 opacity-100' : 'border-slate-200 opacity-0 group-hover:opacity-100'}`}><strong className="block text-[10px] text-slate-800">{region.code}</strong><span className="block text-[9px] text-slate-500">{region.flag} {region.location}</span></span></button>
        })}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-500 shadow-sm backdrop-blur"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Operativa</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-500" />Revisión</span><span>{regions.length} regiones desplegadas</span></div>
      </div>
    </section>
  )
}