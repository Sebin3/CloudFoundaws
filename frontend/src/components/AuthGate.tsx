import type { ReactNode } from 'react'
import { Login } from '../pages/Login'
import { useAuth } from '../auth/AuthContext'

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth()

  if (loading) {
    return <main className="auth-loading"><span className="api-loading-dot" />Verificando sesión…</main>
  }

  if (!session) return <Login />
  return children
}
