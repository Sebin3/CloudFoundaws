type MaterialIconProps = {
  name: string
  className?: string
  filled?: boolean
}

export function MaterialIcon({ name, className = '', filled = false }: MaterialIconProps) {
  return <md-icon className={className} filled={filled ? '' : undefined} aria-hidden="true">{name}</md-icon>
}
