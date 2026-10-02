type IconProps = {
  name: string
  className?: string
  filled?: boolean
}

export function Icon({ name, className = '', filled = false }: IconProps) {
  return <md-icon className={`material-web-icon inline-block shrink-0 align-middle ${className}`} filled={filled ? '' : undefined} aria-hidden="true">{name}</md-icon>
}
