import { costItems } from '../data/seed.js'
import type { CalculatedCost, CloudService } from '../types.js'

const distributionColors = ['#2563eb', '#f59e0b', '#16a34a', '#7c3aed', '#0891b2']

export function proposalCostItems(services: CloudService[]) {
  return services.map((service) => {
    const rate = costItems.find((item) => item.service === service.name || item.service === service.shortName)
    return { ...(rate ?? { quantity: 1, hours: 720, monthly: 0, annual: 0 }), service: service.name, category: service.category, icon: service.icon, iconTone: service.iconTone }
  })
}

export function buildCostReport(usageHours: number, quantities: Record<string, number>, base = costItems) {
  const items: CalculatedCost[] = base.map((item) => {
    const unitHourlyCost = item.monthly / (item.quantity * item.hours)
    const quantity = quantities[item.service] ?? item.quantity
    const monthly = quantity * usageHours * unitHourlyCost
    return {
      ...item,
      unitHourlyCost,
      defaultQuantity: item.quantity,
      quantity,
      hours: usageHours,
      monthly: Number(monthly.toFixed(2)),
      annual: Number((monthly * 12).toFixed(2)),
    }
  })

  const monthlyTotal = items.reduce((total, item) => total + item.monthly, 0)
  const annualTotal = monthlyTotal * 12
  const distribution = items
    .map((item, index) => ({ name: item.category, value: item.monthly, fill: distributionColors[index] }))
    .filter((entry) => entry.value > 0)

  return { items, monthlyTotal, annualTotal, distribution }
}
