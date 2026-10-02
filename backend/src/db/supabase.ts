import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  CloudService,
  InfrastructureResource,
  NotificationItem,
  Proposal,
  ProposalInput,
  DeploymentConfiguration,
  Region,
  SecurityCheck,
  SecurityDetail,
  StatusTone,
} from '../types.js'

try {
  process.loadEnvFile()
} catch {
  /* el .env es opcional si las variables ya están en el entorno */
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) en backend/.env')
}

export const supabase: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function run<T>(task: PromiseLike<{ data: T | null; error: { message: string } | null }>, label: string): Promise<T> {
  const { data, error } = await task
  if (error) {
    throw new Error(`Supabase · ${label}: ${error.message}`)
  }
  return data as T
}

export type CostConfig = {
  usageHours: number
  quantities: Record<string, number>
  budget: number
  usageProfiles: Array<{ hours: number; label: string; detail: string }>
  costTrend: Array<{ month: string; cost: number }>
  costDistribution: Array<{ name: string; value: number; fill: string }>
}

export type AppState = {
  activeRegion: string
  activeProposalId: string | null
  lastSecurityReview: string
  lastNetworkTest: string
}

type DbServiceRow = {
  id: string
  name: string
  short_name: string
  category: string
  description: string
  purpose: string
  status: 'En uso' | 'Disponible' | 'Revisión'
  icon: string
  icon_tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

type DbNotificationRow = {
  id: string
  title: string
  detail: string
  tone: string
}

type DbSecurityRow = SecurityCheck & SecurityDetail

type DbProposalRow = {
  id: string
  user_id: string | null
  solution_name: string
  application_type: string
  description: string
  region: string
  users: string
  availability: string
  objective: string
  selected_services: string[]
  deployment_configuration: DeploymentConfiguration | null
  created_at: string
}

const defaultDeploymentConfiguration = (region = 'us-east-1'): DeploymentConfiguration => ({
  mode: 'single-region',
  trafficStrategy: 'active-passive',
  replication: 'none',
  failover: 'manual',
  locations: [{
    id: 'location-1',
    region,
    administrativeArea: '',
    city: '',
    district: '',
    servers: 1,
    availabilityZones: 1,
    role: 'primary',
  }],
})

type DbCostConfigRow = {
  id: number
  usage_hours: number
  quantities: Record<string, number>
  budget: number
  usage_profiles: CostConfig['usageProfiles']
  cost_trend: CostConfig['costTrend']
  cost_distribution: CostConfig['costDistribution']
}

type DbInfrastructureRow = {
  id: string
  region_code: string
  name: string
  service: string
  zone: string
  state: string
  metric: string
  icon: string
}

type DbAppStateRow = {
  id: number
  active_region: string
  active_proposal_id: string | null
  last_security_review: string
  last_network_test: string
}

type DbUserStateRow = {
  user_id: string
  active_region: string
  active_proposal_id: string | null
  last_security_review: string
  last_network_test: string
}

const mapService = (row: DbServiceRow): CloudService => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name,
  category: row.category,
  description: row.description,
  purpose: row.purpose,
  status: row.status,
  icon: row.icon,
  iconTone: row.icon_tone,
})

const mapProposal = (row: DbProposalRow): Proposal => ({
  id: row.id,
  solutionName: row.solution_name,
  applicationType: row.application_type,
  description: row.description,
  region: row.region,
  users: row.users,
  availability: row.availability,
  objective: row.objective,
  selectedServices: row.selected_services,
  deploymentConfiguration: row.deployment_configuration ?? defaultDeploymentConfiguration(row.region),
  createdAt: row.created_at,
})

const mapCostConfig = (row: DbCostConfigRow): CostConfig => ({
  usageHours: row.usage_hours,
  quantities: row.quantities,
  budget: Number(row.budget),
  usageProfiles: row.usage_profiles,
  costTrend: row.cost_trend,
  costDistribution: row.cost_distribution,
})

export const repo = {
  async getProposalCostConfiguration(userId: string, id: string): Promise<{ usageHours: number; quantities: Record<string, number> } | null> {
    const rows = await run(supabase.from('planning_proposals').select('cost_configuration').eq('id', id).eq('user_id', userId), 'costos de propuesta')
    return rows[0]?.cost_configuration ?? null
  },

  async saveProposalCostConfiguration(userId: string, id: string, configuration: { usageHours: number; quantities: Record<string, number> }): Promise<void> {
    await run(supabase.from('planning_proposals').update({ cost_configuration: configuration }).eq('id', id).eq('user_id', userId), 'guardar costos de propuesta')
  },
  async databaseStatus(): Promise<{ connected: boolean; tablesReady: boolean; services: number }> {
    const { data, error } = await supabase.from('services').select('id')
    return {
      connected: true,
      tablesReady: !error,
      services: (data ?? []).length,
    }
  },
  async getServices(): Promise<CloudService[]> {
    const rows = await run(supabase.from('services').select('*'), 'servicios')
    return rows.map(mapService)
  },

  async getRegions(): Promise<Region[]> {
    const rows = await run(supabase.from('regions').select('*'), 'regiones')
    return rows.map((row: Record<string, unknown>) => {
      const coords = {
        'pe-lima-1': { lat: -12.05, lng: -77.04 },
        'pe-arequipa-1': { lat: -16.4, lng: -71.54 },
        'pe-la-libertad-1': { lat: -8.11, lng: -79.03 },
        'us-east-1': { lat: 38.5, lng: -78.44 },
        'us-east-2': { lat: 40.0, lng: -82.99 },
        'us-west-1': { lat: 37.77, lng: -122.42 },
        'us-west-2': { lat: 45.52, lng: -122.68 },
        'ca-central-1': { lat: 43.65, lng: -79.38 },
        'ca-west-1': { lat: 51.05, lng: -114.07 },
        'eu-west-1': { lat: 53.35, lng: -6.27 },
        'eu-central-1': { lat: 50.11, lng: 8.68 },
        'eu-west-2': { lat: 51.51, lng: -0.13 },
        'eu-south-1': { lat: 45.46, lng: 9.19 },
        'eu-west-3': { lat: 48.86, lng: 2.35 },
        'eu-south-2': { lat: 40.42, lng: -3.7 },
        'eu-north-1': { lat: 59.33, lng: 18.07 },
        'eu-central-2': { lat: 47.38, lng: 8.54 },
        'sa-east-1': { lat: -23.55, lng: -46.63 },
        'ap-east-1': { lat: 22.32, lng: 114.17 },
        'ap-east-2': { lat: 25.03, lng: 121.56 },
        'ap-south-2': { lat: 17.39, lng: 78.49 },
        'ap-southeast-1': { lat: 1.35, lng: 103.82 },
        'ap-southeast-2': { lat: -33.87, lng: 151.21 },
        'ap-southeast-4': { lat: -37.81, lng: 144.96 },
        'ap-southeast-3': { lat: -6.21, lng: 106.85 },
        'ap-southeast-5': { lat: 3.14, lng: 101.69 },
        'ap-southeast-6': { lat: -36.85, lng: 174.76 },
        'ap-southeast-7': { lat: 13.76, lng: 100.5 },
        'ap-northeast-2': { lat: 37.57, lng: 126.98 },
        'ap-northeast-3': { lat: 34.69, lng: 135.5 },
        'ap-northeast-1': { lat: 35.68, lng: 139.65 },
        'ap-south-1': { lat: 19.08, lng: 72.88 },
        'af-south-1': { lat: -33.92, lng: 18.42 },
        'me-south-1': { lat: 26.07, lng: 50.56 },
        'me-central-1': { lat: 25.2, lng: 55.27 },
        'il-central-1': { lat: 32.09, lng: 34.78 },
        'mx-central-1': { lat: 19.43, lng: -99.13 },
      }[row.code as string] ?? { lat: 0, lng: 0 }
      return {
        code: row.code,
        name: row.name,
        location: row.location,
        flag: row.flag,
        services: row.services,
        resources: row.resources,
        availability: row.availability,
        status: row.status,
        tone: row.tone,
        lat: coords.lat,
        lng: coords.lng,
      } as Region
    })
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const rows = await run(supabase.from('notifications').select('*'), 'notificaciones')
    return rows.map((row: DbNotificationRow) => ({ id: row.id, title: row.title, detail: row.detail, tone: row.tone as StatusTone | undefined }))
  },

  async getSecurity(): Promise<{ checks: SecurityCheck[]; details: Record<string, SecurityDetail> }> {
    const rows = await run(supabase.from('security_checks').select('*'), 'control de seguridad')
    const checks: SecurityCheck[] = rows.map((row: DbSecurityRow) => ({
      label: row.label,
      detail: row.detail,
      status: row.status,
      tone: row.tone,
      icon: row.icon,
    }))
    const details = Object.fromEntries(
      rows.map((row: DbSecurityRow) => [
        row.label,
        { scope: row.scope, coverage: row.coverage, action: row.action },
      ]),
    )
    return { checks, details }
  },

  async getCostConfig(): Promise<CostConfig> {
    const rows = await run(supabase.from('cost_config').select('*').eq('id', 1), 'configuración de costos')
    return mapCostConfig(rows[0] as DbCostConfigRow)
  },

  async updateCostConfig(partial: { usageHours?: number; quantities?: Record<string, number> }): Promise<CostConfig> {
    const current = await repo.getCostConfig()
    const next: DbCostConfigRow = {
      id: 1,
      usage_hours: partial.usageHours ?? current.usageHours,
      quantities: partial.quantities ? { ...current.quantities, ...partial.quantities } : current.quantities,
      budget: current.budget,
      usage_profiles: current.usageProfiles,
      cost_trend: current.costTrend,
      cost_distribution: current.costDistribution,
    }
    await run(supabase.from('cost_config').update(next).eq('id', 1), 'actualizar costos')
    return repo.getCostConfig()
  },

  async getResources(regionCode: string): Promise<InfrastructureResource[]> {
    const rows = await run(supabase.from('infrastructure_resources').select('*').eq('region_code', regionCode).order('id'), 'recursos')
    return rows.map((row: DbInfrastructureRow) => ({
      id: row.id,
      name: row.name,
      service: row.service,
      zone: row.zone,
      state: row.state,
      metric: row.metric,
      icon: row.icon,
    }))
  },

  async ensureUserState(userId: string): Promise<DbUserStateRow> {
    const { data: existing, error: existingError } = await supabase.from('user_state').select('*').eq('user_id', userId).maybeSingle()
    if (existingError) throw new Error(`Supabase · estado del usuario: ${existingError.message}`)
    if (existing) return existing as DbUserStateRow
    const rows = await run(supabase.from('user_state').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('*'), 'crear estado del usuario')
    return rows[0] as DbUserStateRow
  },

  async getState(userId: string): Promise<AppState> {
    const row = await repo.ensureUserState(userId)
    return {
      activeRegion: row.active_region,
      activeProposalId: row.active_proposal_id,
      lastSecurityReview: row.last_security_review,
      lastNetworkTest: row.last_network_test,
    }
  },

  async setRegion(userId: string, code: string): Promise<void> {
    await repo.ensureUserState(userId)
    await run(supabase.from('user_state').update({ active_region: code }).eq('user_id', userId), 'cambiar región')
  },

  async setLastSecurityReview(userId: string, value: string): Promise<void> {
    await repo.ensureUserState(userId)
    await run(supabase.from('user_state').update({ last_security_review: value }).eq('user_id', userId), 'revisión de seguridad')
  },

  async setLastNetworkTest(userId: string, value: string): Promise<void> {
    await repo.ensureUserState(userId)
    await run(supabase.from('user_state').update({ last_network_test: value }).eq('user_id', userId), 'prueba de red')
  },

  async getProposals(userId: string): Promise<Proposal[]> {
    const rows = await run(supabase.from('planning_proposals').select('*').eq('user_id', userId).order('created_at', { ascending: false }), 'propuestas')
    return rows.map(mapProposal)
  },

  async createProposal(userId: string, input: ProposalInput): Promise<Proposal> {
    const proposal: Proposal = {
      id: randomUUID(),
      solutionName: input.solutionName,
      applicationType: input.applicationType,
      description: input.description,
      region: input.region,
      users: input.users,
      availability: input.availability,
      objective: input.objective,
      selectedServices: Array.isArray(input.selectedServices) ? input.selectedServices : [],
      deploymentConfiguration: input.deploymentConfiguration ?? defaultDeploymentConfiguration(input.region),
      createdAt: new Date().toISOString(),
    }
    const row: DbProposalRow = {
      id: proposal.id,
      user_id: userId,
      solution_name: proposal.solutionName,
      application_type: proposal.applicationType,
      description: proposal.description,
      region: proposal.region,
      users: proposal.users,
      availability: proposal.availability,
      objective: proposal.objective,
      selected_services: proposal.selectedServices,
      deployment_configuration: proposal.deploymentConfiguration,
      created_at: proposal.createdAt,
    }
    await run(supabase.from('planning_proposals').insert(row), 'crear propuesta')
    await repo.setActiveProposal(userId, proposal.id)
    return proposal
  },

  async updateProposal(userId: string, id: string, input: ProposalInput): Promise<Proposal | null> {
    const { data: existing, error } = await supabase.from('planning_proposals').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
    if (error) {
      throw new Error(`Supabase · propuesta: ${error.message}`)
    }
    if (!existing) {
      return null
    }
    const current = existing as DbProposalRow
    const row: DbProposalRow = {
      ...current,
      solution_name: input.solutionName ?? current.solution_name,
      application_type: input.applicationType ?? current.application_type,
      description: input.description ?? current.description,
      region: input.region ?? current.region,
      users: input.users ?? current.users,
      availability: input.availability ?? current.availability,
      objective: input.objective ?? current.objective,
      selected_services: Array.isArray(input.selectedServices) ? input.selectedServices : current.selected_services,
      deployment_configuration: input.deploymentConfiguration ?? current.deployment_configuration ?? defaultDeploymentConfiguration(input.region ?? current.region),
    }
    await run(supabase.from('planning_proposals').update(row).eq('id', id).eq('user_id', userId), 'actualizar propuesta')
    return mapProposal(row)
  },

  async setActiveProposal(userId: string, id: string | null): Promise<void> {
    await repo.ensureUserState(userId)
    await run(supabase.from('user_state').update({ active_proposal_id: id }).eq('user_id', userId), 'activar propuesta')
  },

  async getActiveProposal(userId: string): Promise<Proposal | null> {
    const [state, proposals] = await Promise.all([repo.getState(userId), repo.getProposals(userId)])
    return proposals.find((proposal) => proposal.id === state.activeProposalId) ?? null
  },

  async deleteProposal(userId: string, id: string): Promise<boolean> {
    const state = await repo.getState(userId)
    if (state.activeProposalId === id) {
      await repo.setActiveProposal(userId, null)
    }
    const result = await supabase.from('planning_proposals').delete().eq('id', id).eq('user_id', userId).select('id')
    if (result.error) {
      throw new Error(`Supabase · eliminar propuesta: ${result.error.message}`)
    }
    return (result.data ?? []).length > 0
  },
}
