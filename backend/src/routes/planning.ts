import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { repo } from '../db/supabase.js'
import type { ProposalInput } from '../types.js'
import { getAuthUserId } from '../middleware/auth.js'

export const planningRouter = Router()

planningRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const [proposals, activeProposal] = await Promise.all([repo.getProposals(userId), repo.getActiveProposal(userId)])
    res.json({ proposals, activeProposal })
  }),
)

planningRouter.post(
  '/proposals',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const input = req.body as ProposalInput
    if (!input || typeof input.solutionName !== 'string') {
      res.status(400).json({ error: 'Propuesta inválida' })
      return
    }
    const proposal = await repo.createProposal(userId, input)
    res.status(201).json({ proposal })
  }),
)

planningRouter.put(
  '/proposals/:id',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const input = (req.body ?? {}) as ProposalInput
    const updated = await repo.updateProposal(userId, String(req.params.id), input)
    if (!updated) {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }
    res.json({ proposal: updated })
  }),
)

planningRouter.post(
  '/active',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const id = (req.body?.id as string | null) ?? null

    if (id) {
      const proposals = await repo.getProposals(userId)
      if (!proposals.some((proposal) => proposal.id === id)) {
        res.status(404).json({ error: 'Propuesta no encontrada' })
        return
      }
    }

    await repo.setActiveProposal(userId, id)
    const activeProposal = await repo.getActiveProposal(userId)
    res.json({ activeProposal })
  }),
)

planningRouter.delete(
  '/proposals/:id',
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req)
    const removed = await repo.deleteProposal(userId, String(req.params.id))
    if (!removed) {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }
    res.json({ ok: true })
  }),
)
