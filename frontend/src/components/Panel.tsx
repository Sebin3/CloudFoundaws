import type { ReactNode } from 'react'

type PanelProps = {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function Panel({ children, className = '', title, subtitle, action }: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      {(title || subtitle || action) && (
        <div className="panel-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="muted-text">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
