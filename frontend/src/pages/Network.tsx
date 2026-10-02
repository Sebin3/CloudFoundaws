import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { AsyncEmptyState } from '../components/AsyncEmptyState'
import type { NetworkNode, Proposal } from '../api/client'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { ApiError, ApiLoading } from '../components/ApiState'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { NetworkDiagram } from '../components/NetworkDiagram'

function clockTime() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function NetworkMetric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: string; tone: string }) {
  return <article className="network-metric rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</p><strong className="mt-2 block text-xl font-extrabold text-slate-800">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p></div><div className={`network-metric-icon flex size-9 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} className="text-[18px]" /></div></div></article>
}

function NetworkProposalPicker({ proposals, selectedId, onChange }: { proposals: Proposal[]; selectedId: string; onChange: (id: string) => void }) {
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
    <div ref={rootRef} className="infra-proposal-picker network-proposal-picker">
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

export function Network() {
  const { data, loading, error, refetch } = useApiData(() => api.getNetwork(), [])
  const { data: planning } = useApiData(() => api.getPlanning(), [])
  const [selectedKey, setSelectedKey] = useState('route53')
  const [selectedProposalId, setSelectedProposalId] = useState('')
  const [testing, setTesting] = useState(false)
  const [lastTest, setLastTest] = useState('')
  const [justValidated, setJustValidated] = useState(false)
  const { toast, show, dismiss } = useToast()

  const nodes = data?.nodes ?? {}
  const trace = data?.trace ?? []
  const selected: NetworkNode | undefined = nodes[selectedKey] ?? (trace[0] ? nodes[trace[0].key] : undefined)
  const proposals = planning?.proposals ?? []
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? planning?.activeProposal ?? proposals[0] ?? null

  useEffect(() => {
    if (!selectedProposalId && selectedProposal?.id) setSelectedProposalId(selectedProposal.id)
  }, [selectedProposal?.id, selectedProposalId])

  const handleProposalChange = async (id: string) => {
    setSelectedProposalId(id)
    try {
      await api.setActiveProposal(id)
      refetch()
      show('Propuesta de red actualizada.')
    } catch {
      show('No se pudo cambiar la propuesta de red.')
    }
  }

  const validate = async () => {
    setTesting(true)
    try {
      const result = await api.validateNetwork()
      setLastTest(result.lastTest)
      setJustValidated(true)
      show(`El flujo de red fue validado exitosamente a las ${clockTime()}.`)
      window.setTimeout(() => setJustValidated(false), 1800)
    } catch {
      setLastTest('Sin conexión')
    } finally {
      setTesting(false)
    }
  }

  if (loading && !data) {
    return <ApiLoading label="Cargando arquitectura de red" />
  }

  if (error && !data) {
    return <ApiError message={error} title="No hay componentes de red todavía" description="La topología aparecerá cuando la propuesta tenga servicios definidos." onRetry={refetch} />
  }

  if (!data) {
    return null
  }

  if (trace.length === 0) {
    return <div className="network-page flex flex-col gap-6"><header className="network-header flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="network-kicker">Arquitectura de red</p><h2 className="network-title mt-1">Topología de la propuesta</h2><p className="network-description mt-2">Selecciona una propuesta para revisar su diseño de conectividad.</p></div>{proposals.length > 0 && <NetworkProposalPicker proposals={proposals} selectedId={selectedProposal?.id ?? ''} onChange={handleProposalChange} />}</header><AsyncEmptyState title="No hay componentes de red todavía" description="La topología aparecerá cuando la propuesta tenga servicios definidos." /></div>
  }

  const vpc = data.vpc

  return (
    <div className="network-page flex flex-col gap-6">
      <header className="network-header flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="network-kicker">Arquitectura de red</p><h2 className="network-title mt-1">Topología de la propuesta</h2><p className="network-description mt-2 max-w-3xl">Revisa el flujo previsto, los controles de red y la relación entre los servicios elegidos.</p></div><div className="network-header-actions">{proposals.length > 0 && <NetworkProposalPicker proposals={proposals} selectedId={selectedProposal?.id ?? ''} onChange={handleProposalChange} />}<button type="button" onClick={validate} disabled={testing} className={`network-action inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-70 sm:w-auto ${justValidated ? 'is-complete' : ''}`}><Icon name={testing ? 'cloud_sync' : justValidated ? 'check_circle' : 'network_check'} className={`text-[18px] ${testing ? 'animate-pulse' : ''}`} />{testing ? 'Revisando topología...' : justValidated ? 'Revisión completa' : 'Revisar topología'}</button></div></header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NetworkMetric label={data.metrics[0]?.label ?? 'Estado del flujo'} value={data.metrics[0]?.value ?? '—'} detail={lastTest ? `Validado ${lastTest.toLowerCase()}` : data.metrics[0]?.detail ?? '—'} icon="check_circle" tone={data.metrics[0]?.tone ?? 'bg-emerald-50 text-emerald-600'} />
        <NetworkMetric label="Latencia total" value={data.metrics[1]?.value ?? '—'} detail={data.metrics[1]?.detail ?? '—'} icon="speed" tone={data.metrics[1]?.tone ?? 'bg-blue-50 text-blue-600'} />
        <NetworkMetric label="Disponibilidad" value={data.metrics[2]?.value ?? '—'} detail={data.metrics[2]?.detail ?? '—'} icon="monitor_heart" tone={data.metrics[2]?.tone ?? 'bg-violet-50 text-violet-600'} />
        <NetworkMetric label="Controles" value={data.metrics[3]?.value ?? '—'} detail={data.metrics[3]?.detail ?? '—'} icon="shield" tone={data.metrics[3]?.tone ?? 'bg-amber-50 text-amber-600'} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="network-surface overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]"><div className="network-surface-header flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold text-slate-800">Flujo de servicios</h3><p className="mt-1 text-sm text-slate-500">Internet, Route 53, CloudFront, VPC y recursos internos.</p></div><span className="network-count inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Icon name="account_tree" className="text-[15px]" />{trace.length} componentes</span></div>
          <NetworkDiagram nodes={nodes} trace={trace} vpc={vpc} selectedKey={selectedKey} onSelect={setSelectedKey} />
          <div className="mx-auto w-full max-w-2xl border-t border-slate-100 px-5 pb-5 pt-4"><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"><Icon name="warning" className="mt-0.5 text-[17px] text-amber-600" /><div><p className="text-xs font-bold text-amber-900">{vpc.warning.title}</p><p className="mt-1 text-[11px] leading-5 text-amber-800">{vpc.warning.detail}</p></div></div></div>
        </section>

        <aside className="network-surface rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6 lg:sticky lg:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Componente seleccionado</p><h3 className="mt-1.5 text-xl font-bold text-slate-800">{selected?.title}</h3></div><span className="network-count inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700"><Icon name="account_tree" className="text-[14px]" />Planificado</span></div><div className="network-selected mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><Icon name={selected?.icon ?? 'hub'} className="text-[22px]" /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-blue-700">{selected?.layer}</p><p className="mt-1 text-sm font-bold text-slate-800">{selected?.endpoint}</p></div></div><dl className="mt-4 space-y-3"><div className="network-detail rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Función</dt><dd className="mt-1.5 text-sm font-bold leading-5 text-slate-700">{selected?.purpose}</dd></div><div className="grid grid-cols-2 gap-2"><div className="network-detail rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[9px] font-extrabold uppercase text-slate-400">Dirección</dt><dd className="mt-1.5 truncate font-mono text-[11px] font-bold text-slate-700">{selected?.address}</dd></div><div className="network-detail rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[9px] font-extrabold uppercase text-slate-400">Latencia de referencia</dt><dd className="mt-1.5 text-sm font-bold text-slate-700">{selected?.latency}</dd></div></div></dl><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-bold text-slate-700">Última revisión</p><p className="mt-1 text-[11px] text-slate-500">{lastTest || data.lastTest}</p></div></aside>
      </div>

      <Toast message={toast} onDismiss={dismiss} />
    </div>
  )
}
