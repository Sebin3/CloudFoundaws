import cors from 'cors'
import express from 'express'
import { repo } from './db/supabase.js'
import { costsRouter } from './routes/costs.js'
import { dashboardRouter } from './routes/dashboard.js'
import { infrastructureRouter } from './routes/infrastructure.js'
import { networkRouter } from './routes/network.js'
import { notificationsRouter } from './routes/notifications.js'
import { planningRouter } from './routes/planning.js'
import { regionsRouter } from './routes/regions.js'
import { securityRouter } from './routes/security.js'
import { servicesRouter } from './routes/services.js'
import { stateRouter } from './routes/state.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const database = await repo.databaseStatus()
  res.json({ ok: true, service: 'cloudfoundations-backend', database, timestamp: new Date().toISOString() })
})

app.use('/api/dashboard', requireAuth, dashboardRouter)
app.use('/api/services', servicesRouter)
app.use('/api/regions', regionsRouter)
app.use('/api/costs', requireAuth, costsRouter)
app.use('/api/security', requireAuth, securityRouter)
app.use('/api/network', requireAuth, networkRouter)
app.use('/api/planning', requireAuth, planningRouter)
app.use('/api/infrastructure', requireAuth, infrastructureRouter)
app.use('/api/notifications', requireAuth, notificationsRouter)
app.use('/api/state', requireAuth, stateRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.listen(port, () => {
  console.log(`CloudOps API escuchando en http://localhost:${port}`)
})
