import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <p className="eyebrow section-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="muted-text section-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}
