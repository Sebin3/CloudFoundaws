import { Router, type Response } from 'express'
import type { Request } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { buildCostReport, proposalCostItems } from '../lib/costs.js'
import { repo } from '../db/supabase.js'
import { getAuthUserId } from '../middleware/auth.js'

export const costsRouter = Router()

costsRouter.get('/proposals/:id', asyncHandler(async (req, res) => {
  await proposalReport(String(req.params.id), getAuthUserId(req), res)
}))

costsRouter.put('/proposals/:id/configuration', asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Configuración inválida' }); return
  }
  await proposalReport(String(req.params.id), getAuthUserId(req), res, req.body)
}))

async function proposalReport(id: string, userId: string, res: Response, input?: { usageHours: number; quantities: Record<string, number> }) {
  const proposals = await repo.getProposals(userId)
  const proposal = proposals.find((entry) => entry.id === id)
  if (!proposal) { res.status(404).json({ error: 'Propuesta no encontrada' }); return }
  const [services, pool, saved] = await Promise.all([repo.getServices(), repo.getCostConfig(), repo.getProposalCostConfiguration(userId, id)])
  const selected = services.filter((service) => proposal.selectedServices.includes(service.id))
  const base = proposalCostItems(selected)
  const defaults = Object.fromEntries(base.map((item) => [item.service, item.quantity]))
  if (input && (!pool.usageProfiles.some((profile) => profile.hours === input.usageHours)
    || !input.quantities || typeof input.quantities !== 'object' || Array.isArray(input.quantities)
    || Object.entries(input.quantities).some(([key, value]) => !Object.hasOwn(defaults, key) || !Number.isInteger(value) || value < 0 || value > 20))) {
    res.status(400).json({ error: 'Configuración inválida para esta propuesta' }); return
  }
  const source = input ?? saved
  const configuration = {
    usageHours: source?.usageHours ?? 720,
    quantities: Object.fromEntries(base.map((item) => [item.service, source?.quantities[item.service] ?? item.quantity])),
  }
  if (input) await repo.saveProposalCostConfiguration(userId, id, configuration)
  const report = buildCostReport(configuration.usageHours, configuration.quantities, base)
  res.json({ ...report, proposal, configuration, budget: pool.budget, usageProfiles: pool.usageProfiles, costTrend: [], budgetPercent: pool.budget > 0 ? Math.round(report.monthlyTotal / pool.budget * 100) : 0 })
}

function sendCostReport(res: Response, usageHours: number, quantities: Record<string, number>, pool: { budget: number; costTrend: Array<{ month: string; cost: number }>; usageProfiles: Array<{ hours: number; label: string; detail: string }> }) {
  const report = buildCostReport(usageHours, quantities)
  res.json({
    ...report,
    costTrend: pool.costTrend,
    budget: pool.budget,
    usageProfiles: pool.usageProfiles,
    configuration: { usageHours, quantities },
    budgetPercent: Math.round((report.monthlyTotal / pool.budget) * 100),
  })
}

costsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const config = await repo.getCostConfig()
    sendCostReport(res, config.usageHours, config.quantities, config)
  }),
)

costsRouter.put(
  '/configuration',
  asyncHandler(async (req: Request, res) => {
    const usageHours = Number(req.body?.usageHours ?? 720)
    const quantities = req.body?.quantities as Record<string, number> | undefined

    const config = await repo.getCostConfig()
    const validHours = config.usageProfiles.some((profile) => profile.hours === usageHours)
    if (!validHours) {
      res.status(400).json({ error: 'Perfil de uso inválido' })
      return
    }

    const next = await repo.updateCostConfig({ usageHours, quantities })
    sendCostReport(res, next.usageHours, next.quantities, next)
  }),
)
