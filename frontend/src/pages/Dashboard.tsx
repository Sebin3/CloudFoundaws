import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CloudService, SecurityCheck, StatusTone } from '../types/cloud'
import { api, type Proposal } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Icon } from '../components/Icon'
import { useAuth } from '../auth/AuthContext'
import { downloadDashboardPdf } from '../lib/pdfReports'

const dashboardChartPalette = ['#141313', '#5f5858', '#898181', '#bdb6b6', '#d8d3d3']
const dashboardChartColor = (index: number) => dashboardChartPalette[index % dashboardChartPalette.length]

function greetingForDate(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function displayUserName(user: User | null) {
  return (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Usuario'
}

function DashboardPanel({ title, subtitle, action, className = '', children }: { title: string; subtitle?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`dashboard-panel min-w-0 p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-800">{title}</h3>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DashboardStatus({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const classes = tone === 'success'
    ? 'dashboard-status dashboard-status-success'
    : tone === 'warning'
      ? 'dashboard-status dashboard-status-warning'
      : tone === 'danger'
        ? 'dashboard-status dashboard-status-danger'
        : tone === 'info'
          ? 'dashboard-status dashboard-status-info'
          : 'dashboard-status dashboard-status-neutral'
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${classes}`}>
      {label}
    </span>
  )
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <article className="content-box width-auto basis-small grow-1 gap-0 light-color gap-4 dashboard-metric-card min-w-0">
      <span className="body-large outline-text line-height-1">{label}</span>
      <span className="headline-small weight-500 dashboard-metric-value">{value}</span>
      {trend && <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600"><Icon name="trending_up" className="text-[15px]" />{trend}</span>}
    </article>
  )
}

function DashboardProposalPicker({ proposals, selectedId, onChange }: { proposals: Proposal[]; selectedId: string; onChange: (id: string) => void }) {
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
    <div ref={rootRef} className="infra-proposal-picker dashboard-proposal-picker">
      <span>Propuesta activa</span>
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

function ServiceRow({ service }: { service: CloudService }) {
  const iconTone = 'dashboard-service-icon'

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0 last:pb-0 first:pt-0">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconTone}`}><Icon name={service.icon} className="text-[18px]" /></div>
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-bold text-slate-800">{service.name}</strong>
        <span className="mt-0.5 block text-xs text-slate-400">{service.category}</span>
      </div>
      <DashboardStatus label={service.status === 'En uso' ? 'Destacado' : service.status} tone={service.status === 'En uso' ? 'success' : service.status === 'Revisión' ? 'warning' : 'neutral'} />
    </div>
  )
}

function SecurityRow({ check }: { check: SecurityCheck }) {
  const iconTone = check.tone === 'warning' ? 'text-amber-600' : check.tone === 'danger' ? 'text-red-600' : check.tone === 'neutral' ? 'text-slate-500' : 'text-emerald-600'
  return (
    <div className="flex items-center gap-2.5 py-3 first:pt-0 last:pb-0">
      <Icon name={check.icon} className={`shrink-0 text-[18px] ${iconTone}`} />
      <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{check.label}</span>
      <DashboardStatus label={check.status} tone={check.tone} />
    </div>
  )
}

function DashboardBlankState({ icon, label, className = '' }: { icon: string; label: string; className?: string }) {
  return <div className={`dashboard-blank-state ${className}`}><Icon name={icon} className="text-[24px]" /><span>{label}</span></div>
}

function EmptyDashboard({ planningCount, proposals, selectedProposalId, onProposalChange }: { planningCount: number | null; proposals: Proposal[]; selectedProposalId: string; onProposalChange: (id: string) => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const emptyMetric = { value: '0' }
  return (
    <div className="dashboard-page flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="dashboard-eyebrow">Resumen de planificación</p>
        <h2 className="dashboard-heading">{greetingForDate()}, {displayUserName(user)}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="dashboard-description max-w-2xl">Los indicadores y paneles aparecerán cuando la información del entorno esté disponible.</p><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => navigate('/planning')} className="dashboard-primary-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"><Icon name="add" className="text-[19px]" />Crear propuesta</button><button type="button" disabled className="dashboard-report-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"><Icon name="download" className="text-[18px]" />Descargar PDF</button></div></div>
      </header>
      {proposals.length > 0 && <DashboardProposalPicker proposals={proposals} selectedId={selectedProposalId} onChange={onProposalChange} />}

      <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Planificaciones creadas" value={planningCount === null ? '0' : `${planningCount}`} />
        <MetricCard label="Costo mensual" {...emptyMetric} />
        <MetricCard label="Costo anual" {...emptyMetric} />
        <MetricCard label="Regiones planificadas" {...emptyMetric} />
        <MetricCard label="Recursos planificados" {...emptyMetric} />
        <MetricCard label="Seguridad" {...emptyMetric} />
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <DashboardPanel className="dashboard-panel-empty" title="Proyección de costos" subtitle="Referencia mensual en USD" action={<button type="button" disabled className="dashboard-ghost-button inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"><span>Últimos 6 meses</span><Icon name="expand_more" className="text-[17px]" /></button>}>
          <DashboardBlankState className="dashboard-chart-empty" icon="monitoring" label="Sin datos de costos" />
        </DashboardPanel>
        <DashboardPanel title="Controles de seguridad" subtitle="Revisión de la propuesta" action={<DashboardStatus label="Sin datos" />}>
          <div className="dashboard-empty-security"><div className="dashboard-score-ring dashboard-score-ring-empty relative flex size-24 shrink-0 items-center justify-center rounded-full"><div className="dashboard-panel dashboard-score-center"><strong className="dashboard-title text-2xl font-bold">0</strong><span className="dashboard-meta text-[10px]">/ 100</span></div></div><div><DashboardStatus label="Sin datos" /><p className="dashboard-description mt-2 text-xs leading-5">La cobertura se mostrará cuando existan controles disponibles.</p></div></div>
          <div className="mt-5 space-y-3"><DashboardBlankState icon="shield" label="Sin controles para mostrar" /></div>
        </DashboardPanel>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DashboardPanel title="Distribución de costos" subtitle="Por categoría de servicio" action={<button type="button" disabled aria-label="Más opciones de costos" className="dashboard-icon-button inline-flex rounded-lg p-1.5"><Icon name="more_horiz" className="text-[19px]" /></button>}>
          <DashboardBlankState icon="donut_large" label="Sin distribución para mostrar" />
        </DashboardPanel>
        <DashboardPanel title="Servicios principales" subtitle="Componentes activos en la solución" action={<button type="button" disabled className="dashboard-text-button inline-flex items-center gap-1 text-xs font-bold">Ver catálogo <Icon name="arrow_forward" className="text-[16px]" /></button>}>
          <DashboardBlankState icon="apps" label="Sin servicios para mostrar" />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Revisión de la propuesta" subtitle="Aspectos que deben confirmarse antes de implementarla" action={<DashboardStatus label="Sin datos" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['monitor_heart', 'Disponibilidad'],
            ['hub', 'Conectividad'],
            ['backup', 'Continuidad'],
          ].map(([icon, label]) => <div className="dashboard-review-card flex items-center gap-3 rounded-xl p-4" key={label}><div className="dashboard-review-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Icon name={icon} className="text-[20px]" /></div><strong className="dashboard-title block text-sm font-bold">{label}</strong></div>)}
        </div>
      </DashboardPanel>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="dashboard-eyebrow">Catálogo rápido</p><h2 className="dashboard-section-title mt-2">Servicios seleccionados</h2></div><button type="button" disabled className="dashboard-ghost-button inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-bold sm:self-auto">Ver todos <Icon name="arrow_forward" className="text-[16px]" /></button></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{['compute', 'storage', 'database', 'network'].map((icon) => <article className="dashboard-service-card flex min-h-[190px] flex-col p-5" key={icon}><div className="dashboard-service-icon flex size-11 items-center justify-center rounded-xl"><Icon name="apps" className="text-[21px]" /></div><h3 className="dashboard-title mt-4 text-base font-bold">Sin servicio</h3><span className="dashboard-meta mt-1 text-xs">Sin categoría</span><p className="dashboard-description mt-3 flex-1 text-sm leading-5">La información aparecerá cuando el catálogo esté disponible.</p><div className="dashboard-divider mt-4 border-t pt-3"><span className="dashboard-meta block text-[11px] font-bold uppercase tracking-[0.08em]">Uso principal</span><strong className="dashboard-title mt-1 block text-xs font-semibold">0</strong></div></article>)}</div>
      </section>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data, refetch: refetchDashboard } = useApiData(() => api.getDashboard(), [])
  const { data: planning, refetch: refetchPlanning } = useApiData(() => api.getPlanning(), [])
  const [selectedProposalId, setSelectedProposalId] = useState('')
  const proposals = planning?.proposals ?? []
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? planning?.activeProposal ?? proposals[0] ?? null

  useEffect(() => {
    if (!selectedProposalId && planning?.activeProposal?.id) setSelectedProposalId(planning.activeProposal.id)
  }, [planning?.activeProposal?.id, selectedProposalId])

  const handleProposalChange = async (id: string) => {
    setSelectedProposalId(id)
    try {
      await api.setActiveProposal(id)
      refetchDashboard()
      refetchPlanning()
    } catch {
      setSelectedProposalId(planning?.activeProposal?.id ?? '')
    }
  }

  if (!data || (planning && !planning.activeProposal)) {
    return <EmptyDashboard planningCount={planning?.proposals.length ?? null} proposals={proposals} selectedProposalId={selectedProposal?.id ?? ''} onProposalChange={handleProposalChange} />
  }

  const { profile, summary } = data

  const monthlyTotal = summary.cost.monthlyTotal
  const annualTotal = summary.cost.annualTotal
  const currency = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`
  const activeProposal = planning?.activeProposal
  const downloadReport = () => {
    if (!activeProposal) return
    downloadDashboardPdf({ proposal: activeProposal, summary, proposalCount: planning?.proposals.length ?? 1 })
  }

  return (
    <div className="dashboard-page flex flex-col gap-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="dashboard-eyebrow">Resumen de planificación</p>
          <h2 className="dashboard-heading mt-2">{greetingForDate()}, {profile.user.name}</h2>
          <p className="dashboard-description mt-2 max-w-2xl">{profile.workspace} · {summary.regions.locations.join(' · ')}. Este es el resumen de tu propuesta cloud.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row"><DashboardProposalPicker proposals={proposals} selectedId={selectedProposal?.id ?? ''} onChange={handleProposalChange} /><button type="button" onClick={() => navigate('/planning')} className="dashboard-primary-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"><Icon name="add" className="text-[19px]" />Crear propuesta</button><button type="button" onClick={downloadReport} className="dashboard-report-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"><Icon name="download" className="text-[18px]" />Descargar PDF</button></div>
      </header>

      <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Planificaciones creadas" value={`${planning?.proposals.length ?? 0}`} />
        <MetricCard label="Costo mensual" value={currency(monthlyTotal)} />
        <MetricCard label="Costo anual" value={currency(annualTotal)} />
        <MetricCard label="Regiones planificadas" value={`${summary.regions.count}`} />
        <MetricCard label="Recursos planificados" value={`${summary.regions.resources}`} />
        <MetricCard label="Seguridad" value={`${summary.security.score}%`} />
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <DashboardPanel title="Proyección de costos" subtitle="Referencia mensual en USD" action={<button type="button" className="dashboard-ghost-button inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"><span>Últimos 6 meses</span><Icon name="expand_more" className="text-[17px]" /></button>}>
          <div className="dashboard-meta-row mb-3 flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-2"><i className="dashboard-dot size-2 rounded-full" />Costo estimado</span>
            <span>{summary.updated.toLowerCase()}</span>
          </div>
          <div className="h-[250px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.cost.trend} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ border: '1px solid var(--chart-grid)', background: 'var(--chart-tooltip-bg)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', fontFamily: 'DM Sans' }} formatter={(value) => [`$${value}`, 'Costo']} />
                <Area type="monotone" dataKey="cost" stroke="var(--dashboard-chart-line)" strokeWidth={2.5} fill="var(--dashboard-chart-fill)" fillOpacity={0.12} activeDot={{ r: 5, fill: 'var(--dashboard-chart-line)', stroke: 'var(--dashboard-surface)', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Controles de seguridad" subtitle="Revisión de la propuesta" action={<button type="button" onClick={() => navigate('/security')} className="dashboard-text-button inline-flex items-center gap-1 text-xs font-bold">Ver detalles <Icon name="arrow_forward" className="text-[16px]" /></button>}>
          <div className="flex items-center gap-4">
            <div className="dashboard-score-ring relative flex size-24 shrink-0 items-center justify-center rounded-full">
              <div className="dashboard-panel dashboard-score-center text-center"><strong className="dashboard-title block text-2xl font-bold leading-none">{summary.security.score}</strong><span className="dashboard-meta mt-1 block text-[10px]">/ 100</span></div>
            </div>
            <div className="min-w-0">
              <DashboardStatus label={summary.security.detail} tone="success" />
              <p className="mt-2 text-xs leading-5 text-slate-500">{summary.security.correctOf}. La arquitectura cumple con los controles principales de seguridad.</p>
            </div>
          </div>
          <div className="dashboard-progress mt-5 h-2 overflow-hidden rounded-full"><span className="block h-full w-[92%] rounded-full" /></div>
          <div className="mt-5 divide-y divide-slate-100">
            {summary.security.checks.map((check) => <SecurityRow check={check} key={check.label} />)}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DashboardPanel title="Distribución de costos" subtitle="Por categoría de servicio" action={<button type="button" aria-label="Más opciones de costos" className="dashboard-icon-button inline-flex rounded-lg p-1.5"><Icon name="more_horiz" className="text-[19px]" /></button>}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative size-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.cost.distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">{summary.cost.distribution.map((entry, index) => <Cell key={entry.name} fill={dashboardChartColor(index)} />)}</Pie><Tooltip formatter={(value) => [`$${value}`, 'Mensual']} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl font-bold tracking-[-0.04em] text-slate-800">{currency(monthlyTotal)}</strong><span className="text-[10px] text-slate-400">mensual</span></div>
            </div>
            <div className="flex w-full flex-1 flex-col gap-3">
              {summary.cost.distribution.map((entry, index) => <div className="dashboard-meta-row flex items-center justify-between gap-4 text-xs" key={entry.name}><span className="inline-flex items-center gap-2"><i className="size-2 rounded-full" style={{ backgroundColor: dashboardChartColor(index) }} />{entry.name}</span><strong className="dashboard-title text-sm">{currency(entry.value)}</strong></div>)}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Servicios principales" subtitle="Componentes activos en la solución" action={<button type="button" onClick={() => navigate('/services')} className="dashboard-text-button inline-flex items-center gap-1 text-xs font-bold">Ver catálogo <Icon name="arrow_forward" className="text-[16px]" /></button>}>
          <div>{summary.services.top.map((service) => <ServiceRow service={service} key={service.id} />)}</div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Revisión de la propuesta" subtitle="Aspectos que deben confirmarse antes de implementarla" action={<DashboardStatus label="Planificada" tone="info" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="dashboard-review-card flex items-center gap-3 rounded-xl p-4"><div className="dashboard-review-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Icon name="monitor_heart" className="text-[20px]" /></div><div><strong className="dashboard-title block text-sm font-bold">Disponibilidad</strong><span className="dashboard-meta text-xs">{summary.architecture.availability} requerida</span></div></div>
          <div className="dashboard-review-card flex items-center gap-3 rounded-xl p-4"><div className="dashboard-review-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Icon name="hub" className="text-[20px]" /></div><div><strong className="dashboard-title block text-sm font-bold">Conectividad</strong><span className="dashboard-meta text-xs">VPC y rutas por definir</span></div></div>
          <div className="dashboard-review-card flex items-center gap-3 rounded-xl p-4"><div className="dashboard-review-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Icon name="backup" className="text-[20px]" /></div><div><strong className="dashboard-title block text-sm font-bold">Continuidad</strong><span className="dashboard-meta text-xs">Revisar respaldo y recuperación</span></div></div>
        </div>
      </DashboardPanel>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="dashboard-eyebrow">Catálogo rápido</p><h2 className="dashboard-section-title mt-2">Servicios seleccionados</h2></div>
          <button type="button" onClick={() => navigate('/services')} className="dashboard-ghost-button inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-bold sm:self-auto">Ver todos <Icon name="arrow_forward" className="text-[16px]" /></button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.services.top.map((service) => {
            return <article className="dashboard-service-card group flex min-h-[190px] flex-col p-5" key={service.id}><div className="flex items-start justify-between gap-3"><div className="dashboard-service-icon flex size-11 items-center justify-center rounded-xl"><Icon name={service.icon} className="text-[21px]" /></div><DashboardStatus label={service.status === 'En uso' ? 'Destacado' : service.status} tone={service.status === 'En uso' ? 'success' : 'neutral'} /></div><h3 className="dashboard-title mt-4 text-base font-bold">{service.name}</h3><span className="dashboard-meta mt-1 text-xs">{service.category}</span><p className="dashboard-description mt-3 flex-1 text-sm leading-5">{service.description}</p><div className="dashboard-divider mt-4 border-t pt-3"><span className="dashboard-meta block text-[11px] font-bold uppercase tracking-[0.08em]">Uso principal</span><strong className="dashboard-title mt-1 block text-xs font-semibold">{service.purpose}</strong></div></article>
          })}
        </div>
      </section>
    </div>
  )
}
