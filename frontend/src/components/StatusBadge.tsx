import type { StatusTone } from '../types/cloud'
import { Icon } from './Icon'

type StatusBadgeProps = {
  label: string
  tone?: StatusTone
  dot?: boolean
}

export function StatusBadge({ label, tone = 'neutral', dot = true }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${tone}`}>
      {dot && <span className="status-dot" />}
      {label}
      {tone === 'danger' && <Icon name="priority_high" className="status-icon" />}
    </span>
  )
}
