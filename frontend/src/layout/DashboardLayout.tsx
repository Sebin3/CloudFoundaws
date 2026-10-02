import { useState, type ReactNode } from 'react'
import type { RouteKey } from '../types/cloud'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'

type DashboardLayoutProps = {
  children: ReactNode
  route: RouteKey
  title: string
  onNavigate: (route: RouteKey) => void
}

export function DashboardLayout({ children, route, title, onNavigate }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar route={route} onNavigate={(nextRoute) => { onNavigate(nextRoute); setMobileOpen(false) }} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-shell">
      <Header route={route} title={title} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
