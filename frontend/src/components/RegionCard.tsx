import type { Region, StatusTone } from '../types/cloud'
import { Icon } from './Icon'

type RegionCardProps = {
  region: Region
  selected?: boolean
  onSelect?: () => void
}

const tones: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
}

export function RegionCard({ region, selected = false, onSelect }: RegionCardProps) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selected ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name="location_on" className="text-[17px]" /></div><span className="text-sm font-extrabold text-slate-800">{region.code}</span></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${tones[region.tone]}`}><span className="size-1.5 rounded-full bg-current opacity-70" />{region.status}</span></div>
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600"><span className="text-base">{region.flag}</span><span>{region.location}</span></div>
      <p className="mt-1 truncate text-[11px] text-slate-400">{region.name}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs"><span className="text-slate-500">{region.services.length} servicios</span><strong className="text-right text-slate-700">{region.resources} recursos</strong></div>
    </button>
  )
}
