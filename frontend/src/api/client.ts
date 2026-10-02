import type { CloudService, Region, SecurityCheck, StatusTone } from '../types/cloud'
import { supabase } from '../lib/supabase'

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`)
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Error ${response.status} al consultar el backend`)
  }

  return response.json() as Promise<T>
}

export type CostTrendPoint = { month: string; cost: number }
export type CostDistribution = { name: string; value: number; fill: string }

export type ProposalInput = {
  solutionName: string
  applicationType: string
  description: string
  region: string
  users: string
  availability: string
  objective: string
  selectedServices: string[]
  deploymentConfiguration: DeploymentConfiguration
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

export type Proposal = ProposalInput & {
  id: string
  createdAt: string
}

export type UsageProfile = { hours: number; label: string; detail: string }

export type MonitoringSample = { sample: number; inbound: number; outbound: number; latency: number }

export type InfraResource = {
  id: string
  name: string
  service: string
  zone: string
  state: string
  metric: string
  icon: string
}

export type NotificationItem = {
  id: string
  title: string
  detail: string
  tone?: StatusTone
}

export type SecurityDetail = { scope: string; coverage: string; action: string }

export type NetworkNode = {
  title: string
  layer: string
  icon: string
  endpoint: string
  purpose: string
  latency: string
  address: string
}

export type NetworkTraceRow = { key: string; step: string; destination: string; policy: string }

export type NetworkMetric = { label: string; value: string; detail: string; icon: string; tone: string }

export type VpcBadge = { label: string; tone: 'neutral' | 'success' }

export type VpcZoneResource = {
  id: string
  label: string
  code: string
  type: string
  tone: 'blue' | 'emerald'
  resourceKey: string
  resourceIcon: string
  resourceTone: string
  resourceTitle: string
  resourceSub: string
  resourceState: string
  instances?: string[]
  detail?: { label: string; value: string; progress: number; caption: string }
}

export type NetworkVpc = {
  name: string
  cidr: string
  region: string
  zonesLabel: string
  badges: VpcBadge[]
  zones: VpcZoneResource[]
  warning: { title: string; detail: string }
}

export type CostsResponse = {
  proposal?: Proposal
  items: CloudCostItem[]
  monthlyTotal: number
  annualTotal: number
  distribution: CostDistribution[]
  costTrend: CostTrendPoint[]
  budget: number
  usageProfiles: UsageProfile[]
  configuration: { usageHours: number; quantities: Record<string, number> }
  budgetPercent: number
}

export type CloudCostItem = {
  unitHourlyCost?: number
  defaultQuantity?: number
  service: string
  category: string
  quantity: number
  hours: number
  monthly: number
  annual: number
  icon: string
  iconTone: StatusTone
}

export type SecurityResponse = {
  checks: SecurityCheck[]
  details: Record<string, SecurityDetail>
  lastReview: string
  score: number
  target: number
  proposal: Proposal | null
}

export type NetworkResponse = {
  nodes: Record<string, NetworkNode>
  trace: NetworkTraceRow[]
  metrics: NetworkMetric[]
  vpc: NetworkVpc
  lastTest: string
}

export type PlanningResponse = {
  proposals: Proposal[]
  activeProposal: Proposal | null
}

export type InfrastructureResponse = {
  regions: Region[]
  stats: { regions: number; resources: number; services: number; status: string; globalAvailability: string }
}

export type DashboardSummary = {
  profile: { user: { name: string; fullName: string; role: string }; workspace: string; greeting: string }
  summary: {
    cost: {
      monthlyTotal: number
      annualTotal: number
      trend: CostTrendPoint[]
      distribution: CostDistribution[]
      budget: number
      budgetPercent: number
      monthLabel: string
    }
    regions: { count: number; locations: string[]; resources: number }
    services: { total: number; inUse: number; top: CloudService[] }
    security: { score: number; checks: SecurityCheck[]; detail: string; correctOf: string }
    architecture: { status: string; availability: string; incidents: string }
    updated: string
  }
}

export const api = {
  health: () => request<{ ok: boolean; service: string }>('/health'),

  getDashboard: () => request<DashboardSummary>('/dashboard'),

  getServices: () => request<{ services: CloudService[]; categories: string[]; total: number; coverage: string }>('/services'),
  getService: (id: string) => request<{ service: CloudService }>(`/services/${id}`),

  getRegions: () => request<{ regions: Region[] }>('/regions'),

  getCosts: () => request<CostsResponse>('/costs'),
  getProposalCosts: (id: string) => request<CostsResponse>(`/costs/proposals/${encodeURIComponent(id)}`),
  updateProposalCosts: (id: string, configuration: { usageHours: number; quantities: Record<string, number> }) =>
    request<CostsResponse>(`/costs/proposals/${encodeURIComponent(id)}/configuration`, { method: 'PUT', body: JSON.stringify(configuration) }),
  updateCostsConfiguration: (configuration: { usageHours: number; quantities: Record<string, number> }) =>
    request<CostsResponse>('/costs/configuration', { method: 'PUT', body: JSON.stringify(configuration) }),

  getSecurity: () => request<SecurityResponse>('/security'),
  runSecurityReview: () => request<{ lastReview: string }>('/security/review', { method: 'POST' }),

  getNetwork: () => request<NetworkResponse>('/network'),
  validateNetwork: () => request<{ lastTest: string }>('/network/validate', { method: 'POST' }),

  getPlanning: () => request<PlanningResponse>('/planning'),
  createProposal: (input: ProposalInput) =>
    request<{ proposal: Proposal }>('/planning/proposals', { method: 'POST', body: JSON.stringify(input) }),
  updateProposal: (id: string, input: ProposalInput) =>
    request<{ proposal: Proposal }>(`/planning/proposals/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  setActiveProposal: (id: string | null) =>
    request<{ activeProposal: Proposal | null }>('/planning/active', { method: 'POST', body: JSON.stringify({ id }) }),
  deleteProposal: (id: string) => request<{ ok: boolean }>(`/planning/proposals/${id}`, { method: 'DELETE' }),

  getInfrastructure: () => request<InfrastructureResponse>('/infrastructure'),
  getResources: (region: string) =>
    request<{ region: Region; resources: InfraResource[] }>(`/infrastructure/resources?region=${encodeURIComponent(region)}`),
  getMonitoringSample: (region: string) =>
    request<{ region: string; sample: MonitoringSample; series: MonitoringSample[] }>(`/infrastructure/monitoring/${region}`),

  getNotifications: () => request<{ notifications: NotificationItem[] }>('/notifications'),

  getState: () => request<{ state: { region: string } }>('/state'),
  setRegion: (code: string) =>
    request<{ state: { region: string } }>('/state/region', { method: 'PUT', body: JSON.stringify({ code }) }),
}
