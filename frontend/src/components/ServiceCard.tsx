import type { CloudService } from '../types/cloud'
import { Icon } from './Icon'
import { StatusBadge } from './StatusBadge'

export function ServiceCard({ service }: { service: CloudService }) {
  return (
    <article className="service-card">
      <div className={`service-logo icon-${service.iconTone}`}><Icon name={service.icon} /></div>
      <div className="service-card-top"><StatusBadge label={service.status} tone={service.status === 'En uso' ? 'success' : service.status === 'Revisión' ? 'warning' : 'neutral'} /></div>
      <h3>{service.name}</h3>
      <span className="category-label">{service.category}</span>
      <p>{service.description}</p>
      <div className="service-card-footer"><span>Uso principal</span><strong>{service.purpose}</strong></div>
    </article>
  )
}
