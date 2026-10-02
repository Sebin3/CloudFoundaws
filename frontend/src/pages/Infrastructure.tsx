import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Region } from '../types/cloud'
import { api, type Proposal } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Icon } from '../components/Icon'
import { AsyncEmptyState } from '../components/AsyncEmptyState'
import type { NetworkArc, ServerNode } from '../components/ServerGlobe'
import { ApiError, ApiLoading } from '../components/ApiState'

const ServerGlobe = lazy(() => import('../components/ServerGlobe'))

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return (
    <article className="infra-summary-card">
      <div className="infra-summary-card-copy"><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>
      <div className="infra-summary-icon"><Icon name={icon} className="text-[19px]" /></div>
    </article>
  )
}

function ProposalPicker({ proposals, selectedId, onChange }: { proposals: Proposal[]; selectedId: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = proposals.find((proposal) => proposal.id === selectedId) ?? proposals[0]

  useEffect(() => {
    if (!open) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="infra-proposal-picker">
      <span>Propuesta visualizada</span>
      <div className={`infra-proposal-select ${open ? 'is-open' : ''}`}>
        <button type="button" className="infra-proposal-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          <span><strong>{selected?.solutionName ?? 'Seleccionar propuesta'}</strong><small>{selected?.applicationType ?? 'Sin propuesta seleccionada'}</small></span>
          <Icon name="expand_more" className="infra-select-arrow text-[18px]" />
        </button>
        {open && <div className="infra-proposal-menu" role="listbox" aria-label="Propuestas disponibles">{proposals.map((proposal) => <button type="button" role="option" aria-selected={proposal.id === selected?.id} key={proposal.id} className={proposal.id === selected?.id ? 'is-selected' : ''} onClick={() => { onChange(proposal.id); setOpen(false) }}><span><strong>{proposal.solutionName}</strong><small>{proposal.applicationType} · {proposal.deploymentConfiguration.locations.length} {proposal.deploymentConfiguration.locations.length === 1 ? 'ubicación' : 'ubicaciones'}</small></span><em>{proposal.id === selected?.id ? 'Seleccionada' : 'Ver propuesta'}</em></button>)}</div>}
      </div>
    </div>
  )
}

function ProposalSummary({ proposal, regions }: { proposal: Proposal; regions: Region[] }) {
  const locations = proposal.deploymentConfiguration.locations
  const servers = locations.reduce((total, location) => total + location.servers, 0)
  const regionName = (code: string) => regions.find((region) => region.code === code)?.location ?? code
  return (
    <section className="infra-proposal-summary">
      <div className="infra-proposal-summary-head"><div><span className="infra-kicker">Diseño seleccionado</span><h3>{proposal.solutionName}</h3><p>{proposal.applicationType} · {locations.length} {locations.length === 1 ? 'ubicación' : 'ubicaciones'} · {servers} {servers === 1 ? 'servidor' : 'servidores'}</p></div><span className="infra-plan-badge"><Icon name="edit_note" className="text-[15px]" />Planificación</span></div>
      <dl className="infra-proposal-facts"><div><dt>Usuarios previstos</dt><dd>{Number(proposal.users || 0).toLocaleString('es-PE')}</dd></div><div><dt>Disponibilidad</dt><dd>{proposal.availability}</dd></div><div><dt>Replicación</dt><dd>{proposal.deploymentConfiguration.replication === 'none' ? 'Sin replicación' : proposal.deploymentConfiguration.replication === 'cross-region' ? 'Entre regiones' : 'Respaldos programados'}</dd></div><div><dt>Failover</dt><dd>{proposal.deploymentConfiguration.failover === 'automatic' ? 'Automático' : 'Manual'}</dd></div></dl>
      <div className="infra-location-tags">{locations.map((location) => <span key={location.id}><Icon name={location.role === 'primary' ? 'star' : location.role === 'backup' ? 'backup' : 'sync'} className="text-[15px]" />{regionName(location.region)} · {location.servers} {location.servers === 1 ? 'servidor' : 'servidores'}</span>)}</div>
    </section>
  )
}

function PlannedLocationCard({ region, locations, selected, onSelect }: { region: Region; locations: Proposal['deploymentConfiguration']['locations']; selected: boolean; onSelect: () => void }) {
  const regionLocations = locations.filter((location) => location.region === region.code)
  const servers = regionLocations.reduce((total, location) => total + location.servers, 0)
  const roles = [...new Set(regionLocations.map((location) => location.role))]
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect} className={`infra-location-card ${selected ? 'is-selected' : ''}`}>
      <div className="infra-location-card-top"><span className="infra-location-code">{region.code}</span><span className="infra-location-status">{selected ? 'En foco' : 'Planificada'}</span></div><div className="infra-location-name"><span>{region.flag}</span><strong>{region.location}</strong></div><p>{region.name}</p><div className="infra-location-card-meta"><span><Icon name="dns" className="text-[15px]" />{servers} {servers === 1 ? 'servidor' : 'servidores'}</span><span><Icon name="hub" className="text-[15px]" />{roles.length} {roles.length === 1 ? 'rol' : 'roles'}</span></div>
    </button>
  )
}

export function Infrastructure() {
  const { data: catalog, loading: catalogLoading, error: catalogError, refetch } = useApiData(() => api.getInfrastructure(), [])
  const { data: planning, loading: planningLoading } = useApiData(() => api.getPlanning(), [])
  const [selectedProposalId, setSelectedProposalId] = useState('')
  const [selectedCode, setSelectedCode] = useState('')
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const regions = useMemo(() => catalog?.regions ?? [], [catalog])
  const proposals = planning?.proposals ?? []
  const selectedProposal = useMemo(() => proposals.find((proposal) => proposal.id === selectedProposalId) ?? planning?.activeProposal ?? proposals[0] ?? null, [planning?.activeProposal, proposals, selectedProposalId])
  const plannedLocations = selectedProposal?.deploymentConfiguration.locations ?? []
  const plannedRegionCodes = useMemo(() => [...new Set(plannedLocations.map((location) => location.region))], [plannedLocations])
  const plannedRegions = useMemo(() => plannedRegionCodes.map((code) => regions.find((region) => region.code === code)).filter((region): region is Region => Boolean(region)), [plannedRegionCodes, regions])
  const selectedRegion = plannedRegions.find((region) => region.code === selectedCode) ?? plannedRegions[0]
  const plannedServers = plannedLocations.reduce((total, location) => total + location.servers, 0)
  const plannedZones = plannedLocations.reduce((total, location) => total + location.availabilityZones, 0)

  useEffect(() => {
    if (!selectedProposalId && planning?.activeProposal?.id) setSelectedProposalId(planning.activeProposal.id)
  }, [planning?.activeProposal?.id, selectedProposalId])

  useEffect(() => {
    const firstPlannedRegion = selectedProposal?.deploymentConfiguration.locations[0]?.region ?? selectedProposal?.region ?? ''
    setSelectedCode(firstPlannedRegion)
  }, [selectedProposal?.id])

  const serverNodes = useMemo<ServerNode[]>(() => plannedRegions.map((region) => ({ id: region.code, name: region.name, lat: region.lat, lng: region.lng, region: region.code, status: 'warning' })), [plannedRegions])
  const networkArcs = useMemo<NetworkArc[]>(() => {
    if (serverNodes.length < 2) return []
    const primary = serverNodes[0]
    return serverNodes.slice(1).map((node) => ({ id: `${primary.id}-${node.id}`, fromNodeId: primary.id, toNodeId: node.id, bandwidthGbps: 1 }))
  }, [serverNodes])

  const handleProposalChange = (id: string) => {
    const proposal = proposals.find((item) => item.id === id)
    setSelectedProposalId(id)
    setSelectionError(null)
    setSelectedCode(proposal?.deploymentConfiguration.locations[0]?.region ?? proposal?.region ?? '')
    void api.setActiveProposal(id).catch(() => setSelectionError('No se pudo guardar la propuesta seleccionada, pero puedes seguir revisando esta vista.'))
  }

  if (catalogLoading || planningLoading) return <ApiLoading label="Cargando infraestructura planificada" />
  if (catalogError && !catalog) return <ApiError message={catalogError} title="No hay catálogo de infraestructura" description="Las ubicaciones aparecerán cuando el catálogo esté disponible." onRetry={refetch} />
  if (!catalog || !proposals.length || !selectedProposal) return <div className="infrastructure-page"><AsyncEmptyState title="No hay propuestas para mostrar" description="Crea una planificación para visualizar su distribución de infraestructura." action={<Link to="/planning" className="infra-empty-action"><Icon name="add" className="text-[17px]" />Crear propuesta</Link>} /></div>
  if (!plannedRegions.length || !selectedRegion) return <div className="infrastructure-page"><header className="infrastructure-header"><div><span className="infra-kicker">Infraestructura Global</span><h2>Distribución de la propuesta</h2><p>Selecciona una propuesta con ubicaciones para visualizar su arquitectura.</p></div><ProposalPicker proposals={proposals} selectedId={selectedProposal.id} onChange={handleProposalChange} /></header><ProposalSummary proposal={selectedProposal} regions={regions} /><AsyncEmptyState title="Esta propuesta todavía no tiene ubicaciones" description="Agrega al menos una ubicación desde Planificación Cloud para verla en el mapa." action={<Link to="/planning" className="infra-empty-action"><Icon name="edit_note" className="text-[17px]" />Editar propuesta</Link>} /></div>

  return (
    <div className="infrastructure-page">
      <header className="infrastructure-header"><div><span className="infra-kicker">Infraestructura Global</span><h2>Distribución de la propuesta</h2><p>Revisa dónde se alojaría tu solución y cómo quedarían distribuidos sus servidores de respaldo.</p></div><ProposalPicker proposals={proposals} selectedId={selectedProposal.id} onChange={handleProposalChange} /></header>
      {selectionError && <div className="infra-inline-message" role="status"><Icon name="info" className="text-[17px]" />{selectionError}</div>}
      <ProposalSummary proposal={selectedProposal} regions={regions} />
      <section aria-label="Resumen de infraestructura" className="infra-summary-grid"><SummaryCard label="Regiones del diseño" value={`${plannedRegions.length}`} detail="Ubicaciones elegidas" icon="public" /><SummaryCard label="Servidores planificados" value={`${plannedServers}`} detail="Capacidad simulada" icon="dns" /><SummaryCard label="Zonas o sitios" value={`${plannedZones}`} detail="Distribución por ubicación" icon="hub" /><SummaryCard label="Servicios elegidos" value={`${selectedProposal.selectedServices.length}`} detail="Componentes de la propuesta" icon="apps" /></section>
      <section className="infra-map-layout"><Suspense fallback={<ApiLoading label="Cargando globo de infraestructura" />}><ServerGlobe nodes={serverNodes} arcs={networkArcs} selectedNodeId={selectedRegion.code} countryCode={selectedRegion.code} onNodeSelect={(node) => setSelectedCode(node.region)} /></Suspense><aside className="infra-inspector"><div className="infra-inspector-heading"><div><span className="infra-kicker">Ubicación en foco</span><h3>{selectedRegion.code}</h3></div><span className="infra-inspector-dot" /></div><div className="infra-region-identity"><span>{selectedRegion.flag}</span><div><strong>{selectedRegion.location}</strong><p>{selectedRegion.name}</p></div></div><dl className="infra-inspector-facts"><div><dt>Servidores</dt><dd>{plannedLocations.filter((location) => location.region === selectedRegion.code).reduce((total, location) => total + location.servers, 0)}</dd></div><div><dt>Zonas / sitios</dt><dd>{plannedLocations.filter((location) => location.region === selectedRegion.code).reduce((total, location) => total + location.availabilityZones, 0)}</dd></div></dl><div className="infra-inspector-section"><span className="infra-kicker">Servicios de referencia</span><div className="infra-chip-list">{selectedRegion.services.map((service) => <span key={service}>{service}</span>)}</div></div><div className="infra-inspector-section"><span className="infra-kicker">Ubicaciones de la propuesta</span><div className="infra-inspector-list">{plannedRegions.map((region) => <button type="button" key={region.code} onClick={() => setSelectedCode(region.code)} className={region.code === selectedRegion.code ? 'is-selected' : ''}><span>{region.code}</span><em>{plannedLocations.filter((location) => location.region === region.code).reduce((total, location) => total + location.servers, 0)} servidores</em></button>)}</div></div><p className="infra-planning-note"><Icon name="info" className="text-[16px]" />Esta vista representa una planificación. No hay servidores reales desplegados.</p></aside></section>
      <section className="infra-planned-section"><div className="infra-section-heading"><div><span className="infra-kicker">Arquitectura geográfica</span><h3>Ubicaciones planificadas</h3><p>Estas son las sedes que pertenecen a la propuesta seleccionada.</p></div><span className="infra-section-count">{plannedRegions.length} {plannedRegions.length === 1 ? 'región' : 'regiones'}</span></div><div className="infra-location-grid">{plannedRegions.map((region) => <PlannedLocationCard key={region.code} region={region} locations={plannedLocations} selected={region.code === selectedRegion.code} onSelect={() => setSelectedCode(region.code)} />)}</div></section>
    </div>
  )
}
