import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'
import { networkMetrics, networkNodes, networkTrace, networkVpc } from '../data/seed.js'
import { getAuthUserId } from '../middleware/auth.js'

export const networkRouter = Router()

networkRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const [state, activeProposal] = await Promise.all([repo.getState(userId), repo.getActiveProposal(userId)])
    const selectedServices = new Set(activeProposal?.selectedServices ?? [])
    const plannedLocations = activeProposal?.deploymentConfiguration.locations ?? []
    // Los servidores pertenecen a las ubicaciones de la planificación,
    // aunque el usuario no haya agregado explícitamente EC2 al catálogo.
    const hasApplication = selectedServices.has('ec2') || plannedLocations.length > 0
    const hasDatabase = selectedServices.has('rds')
    const hasNetwork = selectedServices.has('vpc') || hasApplication || hasDatabase
    const visibleKeys = new Set(['internet'])
    if (selectedServices.has('route53')) visibleKeys.add('route53')
    if (selectedServices.has('cloudfront')) visibleKeys.add('cloudfront')
    if (hasNetwork) visibleKeys.add('vpc')
    if (hasApplication) visibleKeys.add('ec2')
    if (hasDatabase) visibleKeys.add('rds')
    const nodes = activeProposal
      ? Object.fromEntries(Object.entries(networkNodes).filter(([key]) => visibleKeys.has(key)))
      : {}
    const trace = activeProposal ? networkTrace.filter((item) => visibleKeys.has(item.key)) : []
    const primaryLocation = activeProposal?.deploymentConfiguration.locations.find((location) => location.role === 'primary')
      ?? activeProposal?.deploymentConfiguration.locations[0]
    const roleLabel = (role: string) => role === 'primary' ? 'Ubicación primaria' : role === 'backup' ? 'Servidor de respaldo' : 'Réplica regional'
    const plannedServerZones = plannedLocations.map((location, index) => ({
      id: `planned-${location.id}`,
      label: roleLabel(location.role),
      code: `${location.region}${location.city ? ` · ${location.city}` : ''}`,
      type: location.role === 'primary' ? 'PRIMARIA' : location.role === 'backup' ? 'RESPALDO' : 'RÉPLICA',
      tone: location.role === 'primary' ? 'blue' as const : 'emerald' as const,
      resourceKey: 'ec2',
      resourceIcon: 'dns',
      resourceTone: 'bg-orange-50 text-orange-600',
      resourceTitle: `${location.servers} ${location.servers === 1 ? 'servidor planificado' : 'servidores planificados'}`,
      resourceSub: `${location.city || location.administrativeArea || location.region} · ${location.availabilityZones} ${location.availabilityZones === 1 ? 'zona' : 'zonas'}`,
      resourceState: location.role === 'primary' ? 'Activo principal' : 'Continuidad configurada',
      instances: Array.from({ length: Math.max(1, location.servers) }, (_, serverIndex) => `${location.id}-${index + 1}-${serverIndex + 1}`),
    }))
    const databaseZone = networkVpc.zones.find((zone) => zone.resourceKey === 'rds')
    const zones = plannedServerZones.length
      ? [...plannedServerZones, ...(hasDatabase && databaseZone ? [databaseZone] : [])]
      : networkVpc.zones.filter((zone) => selectedServices.has(zone.resourceKey))
    const vpc = {
      ...networkVpc,
      region: primaryLocation?.region ?? networkVpc.region,
      zonesLabel: zones.length === 0 ? 'Sin zonas configuradas' : `${zones.length} ${zones.length === 1 ? 'Availability Zone' : 'Availability Zones'}`,
      zones,
    }
    res.json({
      nodes,
      trace,
      metrics: networkMetrics,
      vpc,
      lastTest: state.lastNetworkTest,
    })
  }),
)

networkRouter.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    await repo.setLastNetworkTest(userId, 'Ahora')
    const state = await repo.getState(userId)
    res.json({ lastTest: state.lastNetworkTest })
  }),
)
