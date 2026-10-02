export type RouteKey =
  | 'dashboard'
  | 'planning'
  | 'costs'
  | 'infrastructure'
  | 'security'
  | 'network'
  | 'services'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type CloudService = {
  id: string
  name: string
  shortName: string
  category: string
  description: string
  purpose: string
  status: 'En uso' | 'Disponible' | 'Revisión'
  icon: string
  iconTone: StatusTone
}

export type CostItem = {
  service: string
  category: string
  quantity: number
  hours: number
  monthly: number
  annual: number
  icon: string
  iconTone: StatusTone
}

export type SecurityCheck = {
  label: string
  detail: string
  status: string
  tone: StatusTone
  icon: string
}

export type Region = {
  name: string
  location: string
  flag: string
  code: string
  services: string[]
  resources: number
  availability: string
  status: string
  tone: StatusTone
  lat: number
  lng: number
}
