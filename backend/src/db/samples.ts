import { initialMonitoringSamples, nextMonitoringSample } from '../data/seed.js'
import type { MonitoringSample } from '../types.js'

let monitoringSamples = initialMonitoringSamples()

export const samples = {
  list(): MonitoringSample[] {
    return monitoringSamples
  },
  next(): MonitoringSample {
    const previous = monitoringSamples[monitoringSamples.length - 1]
    const sample = nextMonitoringSample(previous)
    monitoringSamples = [...monitoringSamples.slice(-21), sample]
    return sample
  },
  reset(): void {
    monitoringSamples = initialMonitoringSamples()
  },
}