import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CostCard } from '../components/CostCard'
import { Icon } from '../components/Icon'
import { AsyncEmptyState } from '../components/AsyncEmptyState'
import type { CloudCostItem, CostsResponse } from '../api/client'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { ApiError, ApiLoading } from '../components/ApiState'
import { downloadCostsPdf } from '../lib/pdfReports'

const colors = ['#141313', '#777777', '#aaa2a2', '#4b4747', '#c8c2c2']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function computeItems(base: CloudCostItem[], usageHours: number, quantities: Record<string, number>): CloudCostItem[] {
  return base.map((item) => {
    const unitHourlyCost = item.unitHourlyCost ?? (item.quantity > 0 ? item.monthly / (item.quantity * item.hours) : 0)
    const quantity = quantities[item.service] ?? item.quantity
    const monthly = quantity * usageHours * unitHourlyCost
    return { ...item, quantity, hours: usageHours, monthly, annual: monthly * 12 }
  })
}

export function Costs() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data, loading, error, refetch } = useApiData(() => api.getPlanning(), [])
  if (selectedId) return <ProposalCosts key={selectedId} id={selectedId} onBack={() => { setSelectedId(null); refetch() }} />
  if (loading && !data) return <ApiLoading label="Cargando propuestas" />
  if (error) return <ApiError message={error} title="No hay propuestas para cotizar" description="Crea una propuesta en Planificación Cloud para consultar sus costos." onRetry={refetch} />
  if (data?.proposals.length === 0) return <AsyncEmptyState title="No hay propuestas para cotizar" description="Primero define los recursos y servicios en Planificación Cloud." />
  return <div className="costs-page flex flex-col gap-5">
    <header><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-600">Economía Cloud</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-800">Estimación de costos</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Selecciona una propuesta para revisar cuánto costaría la arquitectura según su capacidad y horas de uso.</p></header>
    <div className="cost-proposal-list"><div className="cost-list-heading"><div><span className="cost-eyebrow">Propuestas guardadas</span><h3>Elige una arquitectura para cotizar</h3></div><span className="cost-list-count">{data?.proposals.length ?? 0}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data?.proposals.map((proposal) => { const servers = proposal.deploymentConfiguration.locations.reduce((total, location) => total + location.servers, 0); return <button key={proposal.id} type="button" onClick={() => setSelectedId(proposal.id)} className="cost-proposal-card">
      <div className="cost-proposal-card-head"><span className="cost-proposal-icon"><Icon name="payments" className="text-[19px]" /></span><span className="cost-proposal-arrow"><Icon name="arrow_forward" className="text-[17px]" /></span></div><h3>{proposal.solutionName}</h3><p>{proposal.description || 'Sin descripción disponible.'}</p><div className="cost-proposal-meta"><span><Icon name="public" className="text-[15px]" />{proposal.deploymentConfiguration.locations.length} ubicaciones</span><span><Icon name="dns" className="text-[15px]" />{servers} servidores</span><span><Icon name="apps" className="text-[15px]" />{proposal.selectedServices.length} servicios</span></div><div className="cost-proposal-footer"><span>{proposal.applicationType}</span><strong>Revisar costos</strong></div>
    </button> })}</div></div>
  </div>
}

function ProposalCosts({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: catalog, loading, error, refetch } = useApiData(() => api.getProposalCosts(id), [id])

  if (loading && !catalog) {
    return <ApiLoading label="Cargando configuración de costos" />
  }

  if (error && !catalog) {
    return <ApiError message={error} title="No hay configuración de costos todavía" description="La estimación aparecerá cuando exista una propuesta disponible." onRetry={refetch} />
  }

  if (!catalog) {
    return null
  }

  return <div className="costs-page costs-detail flex flex-col gap-4"><button type="button" onClick={onBack} className="cost-back-button"><Icon name="arrow_back" className="text-[16px]" />Todas las propuestas</button><div className="cost-detail-title"><div><span className="cost-eyebrow">Propuesta seleccionada</span><h2>{catalog.proposal?.solutionName}</h2><p>{catalog.proposal?.applicationType} · {catalog.proposal?.deploymentConfiguration.locations.length} ubicaciones configuradas</p></div><span className="cost-detail-region"><Icon name="public" className="text-[15px]" />{catalog.proposal?.region}</span></div><CostsWorkspace catalog={catalog} error={error} proposalId={id} /></div>
}

function CostsWorkspace({ catalog, error, proposalId }: { catalog: CostsResponse; error: string | null; proposalId: string }) {
  const { items, budget, configuration, usageProfiles } = catalog
  const [usageHours, setUsageHours] = useState(configuration.usageHours)
  const [quantities, setQuantities] = useState<Record<string, number>>(configuration.quantities)
  const [exportMessage, setExportMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const baseItems = items
  const calculatedItems = useMemo(() => computeItems(baseItems, usageHours, quantities), [baseItems, usageHours, quantities])

  const monthlyTotal = calculatedItems.reduce((total, item) => total + item.monthly, 0)
  const annualTotal = monthlyTotal * 12
  const budgetPercent = budget > 0 ? Math.round((monthlyTotal / budget) * 100) : 0
  const distribution = calculatedItems.map((item, index) => ({ name: item.service, value: item.monthly, fill: colors[index % colors.length] }))

  const save = async (hours = usageHours, nextQuantities = quantities) => {
    setSaving(true)
    setSaveMessage('')
    try {
      await api.updateProposalCosts(proposalId, { usageHours: hours, quantities: nextQuantities })
      setSaveMessage('Configuración guardada para esta propuesta.')
    } catch (reason) {
      setSaveMessage(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.')
    } finally { setSaving(false) }
  }

  const changeQuantity = (service: string, delta: number) => {
    setQuantities((current) => ({ ...current, [service]: Math.max(0, Math.min(20, (current[service] ?? 0) + delta)) }))
  }

  const reset = async () => {
    const defaults = Object.fromEntries(items.map((item) => [item.service, item.defaultQuantity ?? item.quantity]))
    setUsageHours(720)
    setQuantities(defaults)
    setExportMessage('')
    await save(720, defaults)
  }

  const exportReport = () => {
    if (!catalog.proposal) {
      setExportMessage('No se encontró la propuesta para generar el reporte.')
      return
    }
    downloadCostsPdf({ proposal: catalog.proposal, items: calculatedItems, monthlyTotal, annualTotal, budget, budgetPercent, usageHours })
    setExportMessage('PDF descargado correctamente')
  }

  return (
    <div className="costs-workspace flex flex-col gap-5">
      <div className="cost-save-bar"><div><strong>Supuestos de cálculo</strong><p role="status">{saveMessage || 'Ajusta la capacidad y guarda los cambios de esta propuesta.'}</p></div><button type="button" disabled={saving} onClick={() => void save()} className="cost-save-button">{saving ? 'Guardando...' : 'Guardar cambios'}<Icon name="save" className="text-[17px]" /></button></div>
      {items.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Esta propuesta no tiene servicios seleccionados. Edítala en Planificación Cloud.</p>}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-600">Economía Cloud</p><h2 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-800 sm:text-[32px]">Estimación de costos</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Ajusta la capacidad y revisa el impacto económico de la propuesta. El resultado es una referencia, no una factura real.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={exportReport} className="cost-export-button"><Icon name="download" className="text-[18px]" />Descargar PDF</button>
          <button type="button" onClick={reset} className="cost-reset-button"><Icon name="refresh" className="text-[18px]" />Restablecer</button>
        </div>
      </header>

      {exportMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{exportMessage}</div>}
      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}

      <div className="cost-metrics-grid grid gap-3 md:grid-cols-3">
        <CostCard label="Total mensual" value={formatCurrency(monthlyTotal)} detail="Estimación de la configuración" icon="payments" featured />
        <CostCard label="Proyección anual" value={formatCurrency(annualTotal)} detail="Costo estimado a 12 meses" icon="calendar_month" tone="info" />
        <CostCard label="Presupuesto utilizado" value={`${budgetPercent}%`} detail={`${formatCurrency(monthlyTotal)} de ${formatCurrency(budget)}`} icon="show_chart" tone={monthlyTotal <= budget ? 'success' : 'warning'} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <section className="cost-assumptions-panel min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-bold tracking-[-0.02em] text-slate-800">Supuestos de capacidad</h3><p className="mt-1 text-sm text-slate-500">Ajusta cantidades y horas para comparar escenarios.</p></div><label className="min-w-[190px]"><span className="sr-only">Perfil de uso mensual</span><select value={usageHours} onChange={(event) => setUsageHours(Number(event.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{usageProfiles.map((profile) => <option key={profile.hours} value={profile.hours}>{profile.label} · {profile.hours} h</option>)}</select></label></div>

          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {calculatedItems.map((item) => (
              <div key={item.service} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name={item.icon} className="text-[18px]" /></div><div className="min-w-0"><strong className="block truncate text-sm text-slate-700">{item.service}</strong><span className="mt-0.5 block text-[11px] text-slate-400">{item.category} · {usageHours} h/mes</span></div></div>
                <div className="flex items-center justify-between gap-4 sm:justify-end"><div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => changeQuantity(item.service, -1)} disabled={item.quantity === 0} aria-label={`Reducir cantidad de ${item.service}`} className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"><Icon name="remove" className="text-[16px]" /></button><output aria-label={`Cantidad actual de ${item.service}`} className="w-9 text-center text-sm font-extrabold text-slate-800">{item.quantity}</output><button type="button" onClick={() => changeQuantity(item.service, 1)} disabled={item.quantity === 20} aria-label={`Aumentar cantidad de ${item.service}`} className="flex size-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"><Icon name="add" className="text-[16px]" /></button></div><div className="w-20 text-right"><strong className="block text-sm text-slate-800">{formatCurrency(item.monthly)}</strong><span className="text-[10px] text-slate-400">por mes</span></div></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-slate-700">Perfil activo: {usageProfiles.find((profile) => profile.hours === usageHours)?.label}</p><p className="mt-0.5 text-[11px] text-slate-500">Todos los servicios se calculan con {usageHours} horas mensuales.</p></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${monthlyTotal <= budget ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}><span className="size-1.5 rounded-full bg-current" />{monthlyTotal <= budget ? 'Dentro del presupuesto' : 'Presupuesto excedido'}</span></div>
        </section>

        <section className="cost-chart-panel min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold tracking-[-0.02em] text-slate-800">Costo por servicio</h3><p className="mt-1 text-sm text-slate-500">Comparativa de la configuración actual.</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">USD / mes</span></div>
          <div className="mt-4 h-[245px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={calculatedItems} layout="vertical" margin={{ top: 5, right: 12, left: 0, bottom: 5 }}><CartesianGrid stroke="var(--chart-grid)" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} tickFormatter={(value) => `$${value}`} /><YAxis type="category" dataKey="service" width={82} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick-strong)', fontSize: 10 }} /><Tooltip cursor={{ fill: 'var(--chart-tooltip-bg)' }} formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Mensual']} /><Bar dataKey="monthly" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={16} /></BarChart></ResponsiveContainer></div>
          <div className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-t border-slate-100 pt-4"><div className="relative h-28"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" innerRadius={34} outerRadius={50} paddingAngle={3} stroke="none">{distribution.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-sm text-slate-800">{formatCurrency(monthlyTotal)}</strong><span className="text-[9px] text-slate-400">total</span></div></div><div className="grid grid-cols-2 gap-x-3 gap-y-2">{distribution.map((entry) => <div key={entry.name} className="flex min-w-0 items-center gap-2 text-[10px]"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} /><span className="min-w-0 flex-1 truncate text-slate-500">{entry.name}</span><strong className="text-slate-700">{monthlyTotal ? Math.round((entry.value / monthlyTotal) * 100) : 0}%</strong></div>)}</div></div>
        </section>
      </div>
    </div>
  )
}
