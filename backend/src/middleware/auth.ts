import type { NextFunction, Request, Response } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../db/supabase.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: User
      authUserId?: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Debes iniciar sesión para acceder a este recurso' })
    return
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'La sesión no es válida o ha expirado' })
    return
  }

  req.authUser = data.user
  req.authUserId = data.user.id
  next()
}

export function getAuthUserId(req: Request): string {
  if (!req.authUserId) throw new Error('La solicitud no tiene un usuario autenticado')
  return req.authUserId
}
