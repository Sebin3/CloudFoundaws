import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'
import { getAuthUserId } from '../middleware/auth.js'

export const stateRouter = Router()

stateRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const state = await repo.getState(getAuthUserId(req))
    res.json({ state: { region: state.activeRegion } })
  }),
)

stateRouter.put(
  '/region',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const code = req.body?.code as string | undefined
    const regions = await repo.getRegions()
    if (!code || !regions.some((region) => region.code === code)) {
      res.status(400).json({ error: 'Código de región inválido' })
      return
    }
    await repo.setRegion(userId, code)
    res.json({ state: { region: code } })
  }),
)
