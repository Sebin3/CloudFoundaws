import { MaterialIcon } from './MaterialIcon'
import type { ReactNode } from 'react'

type AsyncEmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function AsyncEmptyState({ title, description, action }: AsyncEmptyStateProps) {
  return (
    <div className="cloudops-content-box cloudops-grow-1 cloudops-align-center cloudops-justify-center async-empty-state" role="status">
      <MaterialIcon name="border_clear" className="async-empty-state-icon" />
      <span className="async-empty-state-title">{title}</span>
      {description && <span className="async-empty-state-description">{description}</span>}
      {action && <div className="async-empty-state-action">{action}</div>}
    </div>
  )
}
