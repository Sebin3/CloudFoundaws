import type { StatusTone } from '../types/cloud'
import { Icon } from './Icon'

type CostCardProps = {
  label: string
  value: string
  detail: string
  icon: string
  tone?: Extract<StatusTone, 'success' | 'warning' | 'info'>
  featured?: boolean
}

const toneClasses = {
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  info: 'bg-blue-50 text-blue-600',
}

export function CostCard({ label, value, detail, icon, tone = 'info', featured = false }: CostCardProps) {
  if (featured) {
    return (
      <article className="cost-card-featured overflow-hidden rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="cost-card-featured-label">{label}</p><strong className="cost-card-featured-value">{value}</strong><p className="cost-card-featured-detail">{detail}</p></div>
          <div className="cost-card-featured-icon flex size-11 shrink-0 items-center justify-center rounded-xl"><Icon name={icon} className="text-[22px]" /></div>
        </div>
        <div className="cost-card-featured-footer"><span className="cost-card-featured-dot" />Según la configuración guardada</div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-slate-400">{label}</p><strong className="mt-3 block text-2xl font-extrabold tracking-[-0.04em] text-slate-800">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}><Icon name={icon} className="text-[20px]" /></div>
      </div>
    </article>
  )
}
