import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from './layout/DashboardLayout'
import { AuthProvider } from './auth/AuthContext'
import { AuthGate } from './components/AuthGate'
import { Costs } from './pages/Costs'
import { Dashboard } from './pages/Dashboard'
import { Infrastructure } from './pages/Infrastructure'
import { Network } from './pages/Network'
import { Planning } from './pages/Planning'
import { Security } from './pages/Security'
import { Services } from './pages/Services'
import type { RouteKey } from './types/cloud'
import './App.css'

const pageTitles: Record<RouteKey, string> = {
  dashboard: 'Dashboard',
  planning: 'Planificación Cloud',
  costs: 'Costos y economía',
  infrastructure: 'Infraestructura global',
  security: 'Seguridad',
  network: 'Arquitectura de red',
  services: 'Catálogo de servicios',
}

const validRoutes: RouteKey[] = ['dashboard', 'planning', 'costs', 'infrastructure', 'security', 'network', 'services']

function CloudApplication() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathRoute = location.pathname.split('/').filter(Boolean)[0] as RouteKey | undefined
  const route = pathRoute && validRoutes.includes(pathRoute) ? pathRoute : 'dashboard'

  return (
    <DashboardLayout route={route} title={pageTitles[route]} onNavigate={(nextRoute) => navigate(`/${nextRoute}`)}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/security" element={<Security />} />
        <Route path="/network" element={<Network />} />
        <Route path="/services" element={<Services />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

function App() {
  return <BrowserRouter><AuthProvider><AuthGate><CloudApplication /></AuthGate></AuthProvider></BrowserRouter>
}

export default App
