import type { RequestHandler } from 'express'

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((error: unknown) => {
      console.error(error)
      if (res.headersSent) {
        next(error)
        return
      }
      res.status(500).json({ error: 'Error interno del servidor' })
    })
  }
}