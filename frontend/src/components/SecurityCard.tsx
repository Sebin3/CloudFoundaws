import type { SecurityCheck, StatusTone } from '../types/cloud'
import { Icon } from './Icon'

type SecurityCardProps = {
  check: SecurityCheck
  selected?: boolean
  onSelect?: () => void
}

const styles: Record<StatusTone, { badge: string; icon: string; border: string; label: string }> = {
  success: { badge: 'security-tone-success', icon: 'security-tone-success', border: 'security-border-success', label: 'Correcto' },
  warning: { badge: 'security-tone-warning', icon: 'security-tone-warning', border: 'security-border-warning', label: 'Revisión' },
  danger: { badge: 'security-tone-danger', icon: 'security-tone-danger', border: 'security-border-danger', label: 'Problema' },
  info: { badge: 'security-tone-info', icon: 'security-tone-info', border: 'security-border-info', label: 'Informativo' },
  neutral: { badge: 'security-tone-neutral', icon: 'security-tone-neutral', border: 'security-border-neutral', label: 'Pendiente' },
}

export function SecurityCard({ check, selected = false, onSelect }: SecurityCardProps) {
  const tone = styles[check.tone]
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={`security-check-tile min-w-0 rounded-2xl border p-4 text-left transition ${selected ? `${tone.border} is-selected` : 'security-border-neutral'}`}>
      <div className="security-check-tile-head"><div className={`security-check-icon ${tone.icon}`}><Icon name={check.icon} className="text-[19px]" /></div><Icon name={selected ? 'radio_button_checked' : 'radio_button_unchecked'} className="security-selection-icon text-[17px]" /></div>
      <div className="mt-4"><span className={`security-status-pill ${tone.badge}`}><span className="security-status-dot" />{tone.label}</span><h4>{check.label}</h4><p>{check.detail}</p></div>
    </button>
  )
}
