import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'

export const regionsRouter = Router()

regionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const regions = await repo.getRegions()
    res.json({ regions })
  }),
)

regionsRouter.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const regions = await repo.getRegions()
    const region = regions.find((item) => item.code === req.params.code)
    if (!region) {
      res.status(404).json({ error: 'Región no encontrada' })
      return
    }
    res.json({ region })
  }),
)