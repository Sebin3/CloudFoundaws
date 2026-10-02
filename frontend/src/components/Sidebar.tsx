import type { RouteKey } from '../types/cloud'
import { Icon } from './Icon'
import { MaterialIcon } from './MaterialIcon'

type SidebarProps = {
  route: RouteKey
  onNavigate: (route: RouteKey) => void
  mobileOpen: boolean
  onClose: () => void
}

const primaryItems: { route: RouteKey; label: string; icon: string }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { route: 'planning', label: 'Planificación Cloud', icon: 'edit_note' },
  { route: 'costs', label: 'Costos', icon: 'payments' },
  { route: 'infrastructure', label: 'Infraestructura global', icon: 'public' },
]

const architectureItems: { route: RouteKey; label: string; icon: string }[] = [
  { route: 'security', label: 'Seguridad', icon: 'shield' },
  { route: 'network', label: 'Arquitectura de red', icon: 'account_tree' },
  { route: 'services', label: 'Catálogo de servicios', icon: 'apps' },
]

function NavItem({ item, active, onNavigate }: { item: (typeof primaryItems)[number]; active: boolean; onNavigate: (route: RouteKey) => void }) {
  const itemClassName = active
    ? 'bg-slate-100 text-slate-950 shadow-sm ring-1 ring-slate-200'
    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'

  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${itemClassName}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => onNavigate(item.route)}
    >
      <MaterialIcon filled={active} name={item.icon} className={`${active ? 'text-slate-950' : 'text-slate-400 transition-colors group-hover:text-slate-700'}`} />
      <span>{item.label}</span>
    </button>
  )
}

export function Sidebar({ route, onNavigate, mobileOpen, onClose }: SidebarProps) {
  const sidebarPosition = mobileOpen ? 'translate-x-0' : '-translate-x-full min-[861px]:translate-x-0'

  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-black/40 min-[861px]:hidden" aria-label="Cerrar menú" onClick={onClose} />}
      <aside className={`sidebar-shell fixed inset-y-0 left-0 z-30 flex w-[258px] flex-col border-r text-slate-700 transition-transform duration-200 ease-out ${sidebarPosition}`}>
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-950 text-white">
            <Icon name="cloud" filled className="text-[21px]" />
          </div>
          <div className="min-w-0">
            <p className="sidebar-brand-name m-0 text-[16px] font-extrabold tracking-[-0.02em]">CloudOps</p>
            <p className="m-0 mt-0.5 text-[8px] font-extrabold tracking-[0.15em] text-slate-400">FOUNDATIONS</p>
          </div>
          <button className="ml-auto inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 min-[861px]:hidden" onClick={onClose} aria-label="Cerrar menú"><Icon name="close" className="text-[20px]" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-3" aria-label="Navegación principal">
          <p className="mb-2 px-2 text-[10px] font-extrabold tracking-[0.14em] text-slate-500">PLANIFICACIÓN</p>
          <div className="space-y-1">
            {primaryItems.map((item) => <NavItem key={item.route} item={item} active={route === item.route} onNavigate={onNavigate} />)}
          </div>
          <p className="mb-2 mt-7 px-2 text-[10px] font-extrabold tracking-[0.14em] text-slate-500">DISEÑO</p>
          <div className="space-y-1">
            {architectureItems.map((item) => <NavItem key={item.route} item={item} active={route === item.route} onNavigate={onNavigate} />)}
          </div>
        </nav>

      </aside>
    </>
  )
}
