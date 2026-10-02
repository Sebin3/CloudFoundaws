import { useState } from 'react'
import { Icon } from '../components/Icon'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { configured, signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleGoogleLogin = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión con Google')
      setSigningIn(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-mark"><Icon name="cloud" className="text-[24px]" /></div>
        <p className="auth-eyebrow">CLOUDOPS · FOUNDATIONS</p>
        <h1>Planifica tu infraestructura cloud</h1>
        <p className="auth-description">Inicia sesión para guardar tus propuestas y consultar tus recursos planificados.</p>
        <button type="button" className="auth-google-button" onClick={handleGoogleLogin} disabled={signingIn || !configured}>
          <Icon name="account_circle" className="text-[21px]" />
          {signingIn ? 'Conectando…' : 'Continuar con Google'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!configured && <p className="auth-hint">Faltan las variables de Supabase en <code>frontend/.env</code>.</p>}
        <p className="auth-footer">Tus propuestas quedan asociadas a tu cuenta.</p>
      </section>
    </main>
  )
}
