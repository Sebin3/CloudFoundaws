import type { StatusTone } from '../types/cloud'
import { Icon } from './Icon'

type StatCardProps = {
  label: string
  value: string
  detail: string
  icon: string
  tone: StatusTone
  trend?: string
}

export function StatCard({ label, value, detail, icon, tone, trend }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon icon-${tone}`}><Icon name={icon} /></div>
      <div className="stat-copy">
        <p className="eyebrow">{label}</p>
        <div className="stat-value-row">
          <strong>{value}</strong>
          {trend && <span className="trend-up"><Icon name="trending_up" />{trend}</span>}
        </div>
        <p className="muted-text">{detail}</p>
      </div>
      <Icon name="more_horiz" className="card-menu-icon" />
    </article>
  )
}
