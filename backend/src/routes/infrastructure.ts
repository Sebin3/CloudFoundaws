import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { samples } from '../db/samples.js'
import { repo } from '../db/supabase.js'

export const infrastructureRouter = Router()

infrastructureRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const regions = await repo.getRegions()
    const totalResources = regions.reduce((total, region) => total + region.resources, 0)
    const deployedServices = new Set(regions.flatMap((region) => region.services)).size
    res.json({
      regions,
      stats: {
        regions: regions.length,
        resources: totalResources,
        services: deployedServices,
        status: 'Operativa',
        globalAvailability: 'Según propuesta',
      },
    })
  }),
)

infrastructureRouter.get(
  '/resources',
  asyncHandler(async (req, res) => {
    const code = req.query.region as string | undefined
    const regions = await repo.getRegions()
    const region = regions.find((item) => item.code === code)
    if (!region) {
      res.status(400).json({ error: 'Debes indicar una región válida con ?region=us-east-1' })
      return
    }
    const resources = await repo.getResources(region.code)
    res.json({ region, resources })
  }),
)

infrastructureRouter.get(
  '/monitoring/:code',
  asyncHandler(async (req, res) => {
    const regions = await repo.getRegions()
    const region = regions.find((item) => item.code === req.params.code)
    if (!region) {
      res.status(404).json({ error: 'Región no encontrada' })
      return
    }
    const sample = samples.next()
    res.json({ region: region.code, sample, series: samples.list() })
  }),
)
