import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'
import { getAuthUserId } from '../middleware/auth.js'
import { evaluateSecurity } from '../lib/security.js'

export const securityRouter = Router()

securityRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const [activeProposal, state] = await Promise.all([repo.getActiveProposal(userId), repo.getState(userId)])
    const security = evaluateSecurity(activeProposal)
    res.json({
      checks: security.checks,
      details: security.details,
      lastReview: state.lastSecurityReview,
      score: security.score,
      target: security.target,
      proposal: security.proposal,
    })
  }),
)

securityRouter.post(
  '/review',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    await repo.setLastSecurityReview(userId, 'Ahora')
    const state = await repo.getState(userId)
    res.json({ lastReview: state.lastSecurityReview })
  }),
)
