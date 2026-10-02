import { useMemo, useState } from 'react'
import type { CloudService } from '../types/cloud'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Icon } from '../components/Icon'
import { AsyncEmptyState } from '../components/AsyncEmptyState'
import { ApiError, ApiLoading } from '../components/ApiState'

const categoryStyles: Record<string, { icon: string; surface: string }> = {
  Compute: { icon: 'dns', surface: 'bg-orange-50 text-orange-600 border-orange-200' },
  Storage: { icon: 'database', surface: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  Database: { icon: 'storage', surface: 'bg-blue-50 text-blue-600 border-blue-200' },
  Security: { icon: 'security', surface: 'bg-red-50 text-red-600 border-red-200' },
  Networking: { icon: 'hub', surface: 'bg-violet-50 text-violet-600 border-violet-200' },
  Delivery: { icon: 'public', surface: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
}

function UsageBadge({ status }: { status: string }) {
  const classes = status === 'En uso' ? 'bg-emerald-50 text-emerald-700' : status === 'Revisión' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
  const dot = status === 'En uso' ? 'bg-emerald-500' : status === 'Revisión' ? 'bg-amber-500' : 'bg-blue-500'
  const label = status === 'En uso' ? 'Destacado' : status === 'Revisión' ? 'Revisar' : 'Disponible'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}><span className={`size-1.5 rounded-full ${dot}`} />{label}</span>
}

function CatalogMetric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: string; tone: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_26px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</p><strong className="mt-2 block text-2xl tracking-[-0.04em] text-slate-800">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p></div><div className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} className="text-[20px]" /></div></div></div>
}

export function Services() {
  const { data, loading, error, refetch } = useApiData(() => api.getServices(), [])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [selectedId, setSelectedId] = useState('')

  const services = useMemo(() => data?.services ?? [], [data])
  const categories = data?.categories ?? []
  const allCategories = ['Todos', ...categories]
  const currentSelectedId = selectedId || services[0]?.id || ''

  const filteredServices = useMemo(() => services.filter((service) => (category === 'Todos' || service.category === category) && `${service.name} ${service.shortName} ${service.description} ${service.purpose}`.toLowerCase().includes(query.toLowerCase())), [category, query, services])
  const selectedService: CloudService | undefined = services.find((service) => service.id === currentSelectedId) ?? services[0]
  const selectedStyle = selectedService ? (categoryStyles[selectedService.category] ?? { icon: selectedService.icon, surface: 'bg-slate-50 text-slate-600 border-slate-200' }) : { icon: 'apps', surface: 'bg-slate-50 text-slate-600 border-slate-200' }
  const activeServices = services.filter((service) => service.status === 'En uso').length

  if (loading && !data) {
    return <ApiLoading label="Cargando catálogo de servicios" />
  }

  if (error && !data) {
    return <ApiError message={error} title="No hay servicios disponibles todavía" description="El catálogo aparecerá cuando existan servicios configurados." onRetry={refetch} />
  }

  if (!data) {
    return null
  }

  if (services.length === 0) {
    return <AsyncEmptyState title="No hay servicios todavía" description="El catálogo aparecerá cuando existan servicios disponibles." />
  }

  return (
    <div className="catalog-page flex flex-col gap-6">
      <header><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Catálogo de servicios</p><h2 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-800 sm:text-[32px]">Servicios disponibles</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Consulta qué servicios puede incluir una propuesta y qué función cumple cada uno dentro de la arquitectura.</p></header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><CatalogMetric label="Servicios catalogados" value={`${data.total}`} detail="Disponibles para planificar" icon="apps" tone="bg-blue-50 text-blue-600" /><CatalogMetric label="Servicios destacados" value={`${activeServices}`} detail="Referencias del catálogo" icon="star" tone="bg-emerald-50 text-emerald-600" /><CatalogMetric label="Categorías" value={`${data.categories.length}`} detail="Áreas funcionales" icon="category" tone="bg-blue-50 text-blue-600" /><CatalogMetric label="Regiones cloud" value={data.coverage} detail="Disponibles en el catálogo" icon="public" tone="bg-slate-100 text-slate-600" /></div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative min-w-0 flex-1 lg:max-w-md"><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, función o descripción" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></div><div className="flex flex-wrap gap-2">{allCategories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${category === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>{item}</button>)}</div></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500"><strong className="text-slate-800">{filteredServices.length}</strong> servicios visibles</span><span className="hidden items-center gap-1.5 text-[10px] font-bold text-slate-400 sm:inline-flex"><span className="size-1.5 rounded-full bg-blue-500" />Catálogo de referencia</span></div></section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2"><div className="grid gap-4 sm:grid-cols-2">{filteredServices.map((service) => { const style = categoryStyles[service.category] ?? { icon: service.icon, surface: 'bg-slate-50 text-slate-600 border-slate-200' }; const isSelected = selectedService?.id === service.id; return <button type="button" key={service.id} aria-pressed={isSelected} onClick={() => setSelectedId(service.id)} className={`group min-w-0 rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_26px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}><div className="flex items-start justify-between gap-3"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${style.surface}`}><Icon name={service.icon || style.icon} className="text-[21px]" /></div><UsageBadge status={service.status} /></div><div className="mt-4"><div className="flex items-center gap-2"><h3 className="truncate text-base font-bold text-slate-800">{service.name}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-500">{service.shortName}</span></div><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{service.category}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{service.description}</p></div><div className="mt-4 border-t border-slate-100 pt-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Función principal</p><div className="mt-2 flex items-start justify-between gap-3"><span className="text-xs font-bold leading-5 text-slate-700">{service.purpose}</span><Icon name="arrow_forward" className={`mt-0.5 shrink-0 text-[17px] transition ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-500'}`} /></div></div></button>})}</div>{filteredServices.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><Icon name="search_off" className="mx-auto text-[28px] text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Sin resultados</p><p className="mt-1 text-xs text-slate-500">Prueba con otra búsqueda o categoría.</p></div>}</section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-6 lg:sticky lg:top-24"><div className="flex items-start justify-between gap-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Detalle del servicio</p>{selectedService && <UsageBadge status={selectedService.status} />}</div><div className="mt-5 flex items-start gap-3"><div className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${selectedStyle.surface}`}><Icon name={selectedService?.icon || selectedStyle.icon} className="text-[24px]" /></div><div className="min-w-0"><h3 className="truncate text-xl font-bold tracking-[-0.03em] text-slate-800">{selectedService?.name}</h3><p className="mt-1 text-xs font-bold text-slate-500">{selectedService?.category}</p></div></div><div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Descripción</p><p className="mt-2 text-sm leading-6 text-slate-600">{selectedService?.description}</p></div><dl className="mt-4 space-y-3"><div className="rounded-xl border border-slate-100 p-3"><dt className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Función principal</dt><dd className="mt-1.5 text-sm font-bold leading-5 text-slate-700">{selectedService?.purpose}</dd></div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-slate-100 p-3"><dt className="text-[9px] font-extrabold uppercase text-slate-400">Código</dt><dd className="mt-1.5 text-xs font-bold text-slate-700">{selectedService?.shortName}</dd></div><div className="rounded-xl border border-slate-100 p-3"><dt className="text-[9px] font-extrabold uppercase text-slate-400">Estado</dt><dd className="mt-1.5 text-xs font-bold text-slate-700">{selectedService?.status}</dd></div></div></dl><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Categoría</p><div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"><Icon name={categoryStyles[selectedService?.category ?? '']?.icon ?? 'category'} className="text-[16px] text-slate-500" /><span className="text-xs font-bold text-slate-700">{selectedService?.category}</span></div></div></aside>
      </div>
    </div>
  )
}
