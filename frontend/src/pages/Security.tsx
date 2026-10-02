import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { AsyncEmptyState } from '../components/AsyncEmptyState'
import { SecurityCard } from '../components/SecurityCard'
import type { StatusTone } from '../types/cloud'
import { api, type Proposal } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { ApiError, ApiLoading } from '../components/ApiState'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'

type SecurityFilter = 'Todos' | 'Correcto' | 'Revisión' | 'Problema'

function clockTime() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const statusStyles: Record<StatusTone, { badge: string; icon: string; border: string; label: string; dot: string }> = {
  success: { badge: 'security-tone-success', icon: 'security-tone-success', border: 'security-border-success', label: 'Correcto', dot: 'security-dot-success' },
  warning: { badge: 'security-tone-warning', icon: 'security-tone-warning', border: 'security-border-warning', label: 'Revisión', dot: 'security-dot-warning' },
  danger: { badge: 'security-tone-danger', icon: 'security-tone-danger', border: 'security-border-danger', label: 'Problema', dot: 'security-dot-danger' },
  info: { badge: 'security-tone-info', icon: 'security-tone-info', border: 'security-border-info', label: 'Informativo', dot: 'security-dot-info' },
  neutral: { badge: 'security-tone-neutral', icon: 'security-tone-neutral', border: 'security-border-neutral', label: 'Pendiente', dot: 'security-dot-neutral' },
}

function StatusPill({ tone, label }: { tone: keyof typeof statusStyles; label?: string }) {
  const style = statusStyles[tone] ?? statusStyles.neutral
  return <span className={`security-status-pill ${style.badge}`}><span className={`security-status-dot ${style.dot}`} />{label ?? style.label}</span>
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
    <div ref={rootRef} className="infra-proposal-picker security-proposal-picker">
      <span>Propuesta evaluada</span>
      <div className={`infra-proposal-select ${open ? 'is-open' : ''}`}>
        <button type="button" className="infra-proposal-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          <span><strong>{selected?.solutionName ?? 'Seleccionar propuesta'}</strong><small>{selected?.applicationType ?? 'Sin propuesta seleccionada'}</small></span>
          <Icon name="expand_more" className="infra-select-arrow text-[18px]" />
        </button>
        {open && <div className="infra-proposal-menu" role="listbox" aria-label="Propuestas disponibles">{proposals.map((proposal) => <button type="button" role="option" aria-selected={proposal.id === selected?.id} key={proposal.id} className={proposal.id === selected?.id ? 'is-selected' : ''} onClick={() => { onChange(proposal.id); setOpen(false) }}><span><strong>{proposal.solutionName}</strong><small>{proposal.applicationType} · {proposal.deploymentConfiguration.locations.length} {proposal.deploymentConfiguration.locations.length === 1 ? 'ubicación' : 'ubicaciones'}</small></span><em>{proposal.id === selected?.id ? 'Seleccionada' : 'Evaluar propuesta'}</em></button>)}</div>}
      </div>
    </div>
  )
}

export function Security() {
  const { data, loading, error, refetch } = useApiData(() => api.getSecurity(), [])
  const { data: planning } = useApiData(() => api.getPlanning(), [])
  const navigate = useNavigate()
  const [selectedProposalId, setSelectedProposalId] = useState('')
  const [filter, setFilter] = useState<SecurityFilter>('Todos')
  const [selectedLabel, setSelectedLabel] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [lastReview, setLastReview] = useState('')
  const [justReviewed, setJustReviewed] = useState(false)
  const { toast, show, dismiss } = useToast()

  const proposals = planning?.proposals ?? []
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? planning?.activeProposal ?? proposals[0] ?? null

  useEffect(() => {
    if (!selectedProposalId && selectedProposal?.id) setSelectedProposalId(selectedProposal.id)
  }, [selectedProposal?.id, selectedProposalId])

  const checks = useMemo(() => data?.checks ?? [], [data])
  const details = data?.details ?? {}
  const effectiveLastReview = lastReview || data?.lastReview || '—'
  const counts = useMemo(() => ({ correct: checks.filter((check) => check.tone === 'success').length, review: checks.filter((check) => check.tone === 'warning').length, problem: checks.filter((check) => check.tone === 'danger').length }), [checks])
  const visibleChecks = checks.filter((check) => filter === 'Todos' || (filter === 'Problema' ? check.tone === 'danger' : check.status === filter))
  const selected = checks.find((check) => check.label === selectedLabel) ?? checks[0]
  const selectedTone = (selected?.tone ?? 'neutral') as keyof typeof statusStyles
  const selectedStyle = statusStyles[selectedTone] ?? statusStyles.neutral
  const score = data?.score ?? 0
  const target = data?.target ?? 0
  const scorePercent = Math.round((score / 100) * 100)

  const handleProposalChange = async (id: string) => {
    setSelectedProposalId(id)
    try {
      await api.setActiveProposal(id)
      refetch()
      show('Propuesta de seguridad actualizada.')
    } catch {
      show('No se pudo cambiar la propuesta de seguridad.')
    }
  }

  const runReview = async () => {
    setReviewing(true)
    try {
      const result = await api.runSecurityReview()
      setLastReview(result.lastReview)
      setJustReviewed(true)
      show(`Revisión ejecutada a las ${clockTime()} · ${counts.correct + counts.review + counts.problem} controles evaluados.`)
      window.setTimeout(() => setJustReviewed(false), 1800)
      refetch()
    } catch {
      setLastReview('Sin conexión')
    } finally {
      setReviewing(false)
    }
  }

  if (loading && !data) {
    return <ApiLoading label="Cargando controles de seguridad" />
  }

  if (error && !data) {
    return <ApiError message={error} title="No hay controles de seguridad todavía" description="Los controles aparecerán cuando la propuesta tenga información de seguridad." onRetry={refetch} />
  }

  if (!data) {
    return null
  }

  if (checks.length === 0) {
    return (
      <div className="security-page flex flex-col gap-6">
        <header className="security-header flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="security-kicker">Seguridad y gobierno</p><h2 className="security-title mt-1 text-3xl font-bold tracking-[-0.045em]">Controles de seguridad</h2><p className="security-description mt-2 max-w-3xl text-sm leading-6">Selecciona una propuesta para revisar sus controles de seguridad.</p></div>
          <div className="security-header-actions">{proposals.length > 0 && <ProposalPicker proposals={proposals} selectedId={selectedProposal?.id ?? ''} onChange={handleProposalChange} />}<button type="button" onClick={() => navigate('/planning')} className="security-review-button inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold sm:w-auto"><Icon name="edit_note" className="text-[18px]" />Ir a planificación</button></div>
        </header>
        <AsyncEmptyState title="No hay controles para esta propuesta" description="Selecciona otra propuesta o completa la información de seguridad desde Planificación Cloud." />
        <Toast message={toast} onDismiss={dismiss} />
      </div>
    )
  }

  const handleSelectDomain = (label: string) => {
    setSelectedLabel(label)
    if (filter !== 'Todos' && !visibleChecks.some((check) => check.label === label)) {
      setFilter('Todos')
    }
  }

  return (
    <div className="security-page flex flex-col gap-6">
      <header className="security-header flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="security-kicker">Seguridad y gobierno</p><h2 className="security-title mt-1 text-3xl font-bold tracking-[-0.045em]">Controles de seguridad</h2><p className="security-description mt-2 max-w-3xl text-sm leading-6">Evaluación de la propuesta <strong>{data.proposal?.solutionName}</strong>. Revisa qué está contemplado y qué falta definir antes de implementarla.</p></div><div className="security-header-actions">{proposals.length > 0 && <ProposalPicker proposals={proposals} selectedId={selectedProposal?.id ?? ''} onChange={handleProposalChange} />}<button type="button" onClick={runReview} disabled={reviewing} className={`security-review-button inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-70 sm:w-auto ${justReviewed ? 'is-complete' : ''}`}><Icon name={reviewing ? 'cloud_sync' : justReviewed ? 'check_circle' : 'refresh'} className={`text-[18px] ${reviewing ? 'animate-spin' : ''}`} />{reviewing ? 'Revisando controles...' : justReviewed ? 'Revisión completa' : 'Revisar controles'}</button></div></header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center"><div><div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="shield_lock" className="text-[23px]" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold tracking-[-0.025em] text-slate-800">Cobertura de la propuesta</h3><StatusPill tone={(checks.some((check) => check.tone === 'danger') ? 'danger' : counts.review > 0 ? 'warning' : 'success')} label={counts.review + counts.problem > 0 ? 'Requiere seguimiento' : 'Sólida'} /></div><p className="mt-1.5 text-sm text-slate-500">Última revisión: {effectiveLastReview}. Hay {counts.review + counts.problem} controles que necesitan atención.</p></div></div><div className="mt-6 grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-700">Correctos</span><Icon name="check_circle" className="text-[17px] text-emerald-600" /></div><strong className="mt-1.5 block text-2xl text-slate-800">{counts.correct}</strong></div><div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-700">En revisión</span><Icon name="warning" className="text-[17px] text-amber-600" /></div><strong className="mt-1.5 block text-2xl text-slate-800">{counts.review}</strong></div><div className="rounded-xl border border-red-100 bg-red-50/60 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-red-700">Problemas</span><Icon name="error" className="text-[17px] text-red-600" /></div><strong className="mt-1.5 block text-2xl text-slate-800">{counts.problem}</strong></div></div></div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-center"><div className="relative mx-auto flex size-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--security-accent) 0 ${scorePercent}%, var(--security-track) ${scorePercent}% 100%)` }}><div className="security-score-center flex size-[88px] flex-col items-center justify-center rounded-full"><strong className="text-3xl font-extrabold tracking-[-0.05em] text-slate-800">{score}</strong><span className="text-[10px] font-bold uppercase text-slate-400">de 100</span></div></div><p className="mt-3 text-xs font-bold text-slate-700">Cobertura de controles</p><p className="mt-1 text-[11px] text-slate-500">Meta de referencia: {target}</p></div>
        </div>
      </section>

      <section><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-lg font-bold text-slate-800">Dominios de control</h3><p className="mt-1 text-sm text-slate-500">Selecciona un dominio para revisar su cobertura y siguiente acción.</p></div><div className="flex flex-wrap gap-2">{(['Todos', 'Correcto', 'Revisión', 'Problema'] as SecurityFilter[]).map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>{item}</button>)}</div></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{visibleChecks.map((check) => <SecurityCard key={check.label} check={check} selected={selected?.label === check.label} onSelect={() => handleSelectDomain(check.label)} />)}</div></section>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Control seleccionado</p><h3 className="mt-1.5 text-lg font-bold text-slate-800">{selected?.label}</h3><p className="mt-1 text-xs text-slate-500">{details[selected?.label]?.scope}</p></div><StatusPill tone={selectedTone} /></div><div className={`mt-5 rounded-xl border p-4 ${selectedStyle.border} ${selectedStyle.icon}`}><div className="flex items-start gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-white ${selectedStyle.badge}`}> <Icon name={selected?.icon ?? 'shield'} className="text-[20px]" /></div><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Cobertura actual</p><p className="mt-1.5 text-sm font-bold leading-6 text-slate-700">{details[selected?.label]?.coverage}</p></div></div></div><div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4"><Icon name="tips_and_updates" className="mt-0.5 text-[19px] text-blue-600" /><div><p className="text-xs font-extrabold text-blue-800">Siguiente acción</p><p className="mt-1 text-sm leading-6 text-blue-800/80">{details[selected?.label]?.action}</p></div></div></section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"><h3 className="text-lg font-bold text-slate-800">Responsabilidades del diseño</h3><p className="mt-1 text-sm text-slate-500">Define qué debe cubrir la plataforma y qué debe configurar el equipo.</p><div className="mt-5 space-y-3"><div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex items-center gap-2 text-blue-700"><Icon name="cloud" className="text-[19px]" /><strong className="text-sm">Plataforma cloud</strong></div><p className="mt-2 text-xs leading-5 text-slate-600">Ubicaciones, red base, servicios disponibles y continuidad.</p></div><div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4"><div className="flex items-center gap-2 text-violet-700"><Icon name="manage_accounts" className="text-[19px]" /><strong className="text-sm">Equipo del proyecto</strong></div><p className="mt-2 text-xs leading-5 text-slate-600">Identidades, datos, permisos, aplicaciones y configuraciones.</p></div></div><button type="button" onClick={() => { setFilter('Revisión'); handleSelectDomain('Cumplimiento') }} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100"><Icon name="priority_high" className="text-[16px]" />Revisar pendientes</button></section>
      </div>

      <Toast message={toast} onDismiss={dismiss} />
    </div>
  )
}
