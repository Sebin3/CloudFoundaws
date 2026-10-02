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

export type CalculatedCost = CostItem

export type SecurityCheck = {
  label: string
  detail: string
  status: string
  tone: StatusTone
  icon: string
}

export type SecurityDetail = {
  scope: string
  coverage: string
  action: string
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

export type DeploymentLocation = {
  id: string
  region: string
  administrativeArea: string
  city: string
  district: string
  servers: number
  availabilityZones: number
  role: 'primary' | 'replica' | 'backup'
}

export type DeploymentConfiguration = {
  mode: 'single-region' | 'multi-region'
  trafficStrategy: 'active-passive' | 'active-active'
  replication: 'none' | 'scheduled-backup' | 'cross-region'
  failover: 'manual' | 'automatic'
  locations: DeploymentLocation[]
}

export type ProposedService = {
  id: string
  name: string
  shortName: string
  category: string
  description: string
  purpose: string
  status: string
  icon: string
  iconTone: StatusTone
}

export type ProposalInput = {
  solutionName: string
  applicationType: string
  description: string
  region: string
  users: string
  availability: string
  objective: string
  selectedServices: string[]
  deploymentConfiguration?: DeploymentConfiguration
}

export type Proposal = ProposalInput & {
  id: string
  createdAt: string
  deploymentConfiguration: DeploymentConfiguration
}

export type NotificationItem = {
  id: string
  title: string
  detail: string
  tone?: StatusTone
}

export type InfrastructureResource = {
  id: string
  name: string
  service: string
  zone: string
  state: string
  metric: string
  icon: string
}

export type MonitoringSample = {
  sample: number
  inbound: number
  outbound: number
  latency: number
}
