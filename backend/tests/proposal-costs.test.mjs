import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
const { repo } = await import('../dist/db/supabase.js')
const { services, usageProfiles } = await import('../dist/data/seed.js')
const { costsRouter } = await import('../dist/routes/costs.js')

test('costos aislados por propuesta, validación y actualización de servicios', async () => {
  const proposals = [{ id: 'a', selectedServices: ['ec2', 'iam'] }, { id: 'b', selectedServices: ['s3', 'cloudfront', 'vpc'] }]
  const configs = new Map()
  repo.getProposals = async () => proposals
  repo.getServices = async () => services
  repo.getCostConfig = async () => ({ budget: 450, usageProfiles })
  repo.getProposalCostConfiguration = async (id) => configs.get(id) ?? null
  repo.saveProposalCostConfiguration = async (id, config) => { configs.set(id, config) }
  const app = express()
  app.use(express.json())
  app.use('/costs', costsRouter)
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const url = `http://127.0.0.1:${server.address().port}/costs/proposals/`
  const get = async (id) => (await fetch(url + id)).json()
  const put = (id, body) => fetch(url + id + '/configuration', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  try {
    assert.deepEqual((await get('a')).items.map((item) => item.service), ['Amazon EC2', 'AWS IAM'])
    assert.deepEqual((await get('b')).items.map((item) => item.service), ['Amazon S3', 'Amazon VPC', 'Amazon CloudFront'])
    assert.equal((await put('a', { usageHours: 80, quantities: { 'Amazon EC2': 0, 'AWS IAM': 1 } })).status, 200)
    const zero = await get('a')
    assert.equal(zero.monthlyTotal, 0)
    assert.ok(zero.items[0].unitHourlyCost > 0)
    assert.equal((await get('b')).configuration.usageHours, 720)
    assert.equal((await put('a', { usageHours: 80, quantities: { 'Amazon S3': 2 } })).status, 400)
    assert.equal((await put('a', { usageHours: 80, quantities: { 'Amazon EC2': -1 } })).status, 400)
    assert.equal((await put('a', { usageHours: 123, quantities: {} })).status, 400)
    assert.equal((await fetch(url + 'missing')).status, 404)
    proposals[0].selectedServices = ['rds']
    assert.deepEqual((await get('a')).items.map((item) => item.service), ['Amazon RDS'])
    proposals[0].selectedServices = []
    assert.equal((await get('a')).monthlyTotal, 0)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
