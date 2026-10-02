import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'

export const servicesRouter = Router()

servicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const services = await repo.getServices()
    const regions = await repo.getRegions()
    const categories = Array.from(new Set(services.map((service) => service.category)))
    const coverage = `${regions.length}`
    res.json({ services, categories, total: services.length, coverage })
  }),
)

servicesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const services = await repo.getServices()
    const service = services.find((item) => item.id === req.params.id)
    if (!service) {
      res.status(404).json({ error: 'Servicio no encontrado' })
      return
    }
    res.json({ service })
  }),
)
