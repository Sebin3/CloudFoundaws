import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (input: { name: string; avatarFile?: File | null; notificationsEnabled: boolean }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signInWithGoogle: async () => {
      if (!supabase) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en frontend/.env')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    updateProfile: async ({ name, avatarFile, notificationsEnabled }) => {
      if (!supabase || !session?.user) throw new Error('No hay una sesión activa')

      let avatarUrl = session.user.user_metadata?.avatar_url as string | undefined
      if (avatarFile) {
        const extension = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${session.user.id}/avatar.${extension}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
          upsert: true,
          cacheControl: '3600',
          contentType: avatarFile.type,
        })
        if (uploadError) throw uploadError
        avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...session.user.user_metadata,
          full_name: name.trim(),
          name: name.trim(),
          ...(avatarUrl ? { avatar_url: avatarUrl, picture: avatarUrl } : {}),
          notifications_enabled: notificationsEnabled,
        },
      })
      if (error) throw error
      if (data.user) setSession((current) => current ? { ...current, user: data.user } : current)
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return context
}
