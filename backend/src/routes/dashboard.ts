import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { buildCostReport } from '../lib/costs.js'
import { evaluateSecurity } from '../lib/security.js'
import { repo } from '../db/supabase.js'

export const dashboardRouter = Router()

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

dashboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = req.authUser
    const metadata = user?.user_metadata as { full_name?: string; name?: string } | undefined
    const fallbackName = user?.email?.split('@')[0] ?? 'Usuario'
    const displayName = metadata?.full_name ?? metadata?.name ?? fallbackName
    const userId = req.authUser?.id
    const [services, regions, activeProposal, config] = await Promise.all([
      repo.getServices(),
      repo.getRegions(),
      userId ? repo.getActiveProposal(userId) : Promise.resolve(null),
      repo.getCostConfig(),
    ])
    const security = evaluateSecurity(activeProposal)
    const report = buildCostReport(config.usageHours, config.quantities)
    const plannedRegionCodes = activeProposal?.deploymentConfiguration.locations.map((location) => location.region)
      ?? (activeProposal?.region ? [activeProposal.region] : [])
    const plannedRegions = [...new Set(plannedRegionCodes)]
      .map((code) => regions.find((region) => region.code === code))
      .filter((region): region is (typeof regions)[number] => Boolean(region))
    const plannedLocations = [...new Set(plannedRegions.map((region) => region.location))]
    const totalResources = plannedRegions.reduce((total, region) => total + region.resources, 0)
    const securityScore = security.score
    const inUse = services.filter((service) => service.status === 'En uso').length

    res.json({
      profile: {
        user: { name: displayName, fullName: displayName, role: 'Usuario' },
        workspace: 'Nova Systems',
        greeting: greetingForHour(new Date().getHours()),
      },
      summary: {
        cost: {
          monthlyTotal: Number(report.monthlyTotal.toFixed(2)),
          annualTotal: Number(report.annualTotal.toFixed(2)),
          trend: config.costTrend,
          distribution: config.costDistribution,
          budget: config.budget,
          budgetPercent: Math.round((report.monthlyTotal / config.budget) * 100),
          monthLabel: new Date().toLocaleString('es-ES', { month: 'long' }),
        },
        regions: {
          count: plannedRegions.length,
          locations: plannedLocations,
          resources: totalResources,
        },
        services: {
          total: services.length,
          inUse,
          top: services.slice(0, 4),
        },
        security: {
          score: securityScore,
          checks: security.checks.slice(0, 3),
          detail: activeProposal ? 'Evaluación de la propuesta activa' : 'Sin propuesta para evaluar',
          correctOf: `${security.checks.filter((check) => check.tone === 'success').length} de ${security.checks.length} controles correctos`,
        },
        architecture: {
          status: 'Operativa',
          availability: activeProposal?.availability ?? 'No definida',
          incidents: 'sin incidentes',
        },
        updated: 'Actualizado hace 2 horas',
      },
    })
  }),
)
