import { Icon } from './Icon'
import type { NetworkNode, NetworkTraceRow, NetworkVpc } from '../api/client'

function FlowArrow() {
  return (
    <svg width="18" height="28" viewBox="0 0 18 28" aria-hidden="true" className="my-1 shrink-0">
      <line x1="9" y1="0" x2="9" y2="20" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="3.5,20 14.5,20 9,26" fill="#cbd5e1" />
    </svg>
  )
}

type FlowItem = { step: string; key: string; node: NetworkNode; destination: string; policy: string }

function NodeCard({ item, selected, onSelect }: { item: FlowItem; selected: boolean; onSelect: (key: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      aria-pressed={selected}
      className={`flex w-full max-w-2xl items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${selected ? 'border-orange-300 bg-orange-50/60 ring-2 ring-orange-100' : 'border-slate-200 hover:border-orange-200'}`}
    >
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition ${selected ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}><Icon name={item.node.icon} className="text-[22px]" /></span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-extrabold text-slate-800">{item.node.title}</strong>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">{item.node.endpoint}</span>
        <span className="mt-1 block truncate font-mono text-[9px] text-slate-400">{item.destination} · {item.policy}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-extrabold ${selected ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{item.step}</span>
        <span className="text-[11px] font-bold text-slate-600">{item.node.latency}</span>
      </span>
    </button>
  )
}

function VpcPanel({ item, vpc, selectedKey, onSelect }: { item: FlowItem; vpc: NetworkVpc; selectedKey: string; onSelect: (key: string) => void }) {
  const selected = selectedKey === 'vpc'
  return (
    <div className={`w-full max-w-2xl rounded-2xl border-2 border-dashed p-5 transition ${selected ? 'border-orange-300 bg-orange-50/40' : 'border-blue-200 bg-blue-50/30'}`}>
      <button type="button" onClick={() => onSelect(item.key)} aria-pressed={selected} className="flex w-full items-center gap-3 text-left">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition ${selected ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}><Icon name="hub" className="text-[22px]" /></span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-extrabold text-slate-800">{item.node.title}</strong>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">{vpc.name} · {vpc.cidr} {'·'} {vpc.region} {'·'} {vpc.zonesLabel}</span>
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-lg border border-blue-200 bg-white/70 px-2 py-1 text-[9px] font-bold text-blue-700 sm:block">VPC Contenedor</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-extrabold text-slate-600">{item.step}</span>
        </span>
      </button>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {vpc.zones.map((zone) => {
          const isBlue = zone.tone === 'blue'
          const active = selectedKey === zone.resourceKey
          return (
            <button
              type="button"
              key={zone.id}
              onClick={() => onSelect(zone.resourceKey)}
              aria-pressed={active}
              className={`rounded-xl border bg-white p-3 text-left transition ${active ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200 hover:border-orange-200'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className={`text-[9px] font-extrabold uppercase tracking-[0.08em] ${isBlue ? 'text-blue-700' : 'text-emerald-700'}`}>{zone.label}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-slate-400">{zone.code}</p>
                </div>
                <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-extrabold ${isBlue ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{zone.type}</span>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${zone.resourceTone}`}><Icon name={zone.resourceIcon} className="text-[17px]" /></span>
                <span className="min-w-0">
                  <strong className="block truncate text-xs font-extrabold text-slate-800">{zone.resourceTitle}</strong>
                  <span className="mt-0.5 block truncate text-[9px] text-slate-500">{zone.resourceSub}</span>
                </span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700"><i className="size-1.5 rounded-full bg-emerald-500" />{zone.resourceState}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function NetworkDiagram({ nodes, trace, vpc, selectedKey, onSelect }: { nodes: Record<string, NetworkNode>; trace: NetworkTraceRow[]; vpc: NetworkVpc; selectedKey: string; onSelect: (key: string) => void }) {
  const flow: FlowItem[] = []
  let insideVpc = false
  for (const row of trace) {
    const node = nodes[row.key]
    if (!node) {
      continue
    }
    if (row.key === 'vpc') {
      insideVpc = true
    }
    if (insideVpc && row.key !== 'vpc') {
      continue
    }
    flow.push({ step: row.step, key: row.key, node, destination: row.destination, policy: row.policy })
  }

  return (
    <div className="flex w-full flex-col items-center py-6">
      {flow.map((item, index) => (
        <div key={item.key} className="flex w-full flex-col items-center">
          {index > 0 && <FlowArrow />}
          {item.key === 'vpc' ? <VpcPanel item={item} vpc={vpc} selectedKey={selectedKey} onSelect={onSelect} /> : <NodeCard item={item} selected={selectedKey === item.key} onSelect={onSelect} />}
        </div>
      ))}
    </div>
  )
}