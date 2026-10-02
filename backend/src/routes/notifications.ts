import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'

export const notificationsRouter = Router()

notificationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const notifications = await repo.getNotifications()
    res.json({ notifications })
  }),
)