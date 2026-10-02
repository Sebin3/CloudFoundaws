import { useEffect, useState, type ChangeEvent } from 'react'
import type { RouteKey } from '../types/cloud'
import type { NotificationItem } from '../api/client'
import { api } from '../api/client'
import { applyTheme, getStoredTheme, resolveInitialTheme, setStoredTheme, type ThemeMode } from '../lib/theme'
import { Icon } from './Icon'
import { useAuth } from '../auth/AuthContext'

const seenNotificationsKey = 'cloudops:notifications:seenIds'

function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(seenNotificationsKey)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

type HeaderProps = {
  route: RouteKey
  title: string
  onOpenSidebar: () => void
}

const labels: Record<RouteKey, string> = {
  dashboard: 'Resumen general',
  planning: 'Definición de solución',
  costs: 'Economía Cloud',
  infrastructure: 'Regiones y recursos',
  security: 'Controles y cumplimiento',
  network: 'Topología de solución',
  services: 'Catálogo de servicios',
}

function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const { user, updateProfile, signOut } = useAuth()
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setName((user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? 'Usuario')
    setAvatarPreview((user.user_metadata?.avatar_url as string | undefined) ?? (user.user_metadata?.picture as string | undefined) ?? null)
    setNotificationsEnabled(user.user_metadata?.notifications_enabled !== false)
    setAvatarFile(null)
    setMessage(null)
  }, [user])

  if (!user) return null

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Selecciona una imagen válida.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('La imagen no puede superar los 2 MB.')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('Escribe un nombre para continuar.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateProfile({ name, avatarFile, notificationsEnabled })
      setMessage('Perfil actualizado correctamente.')
      setAvatarFile(null)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button type="button" className="notification-drawer-backdrop" aria-label="Cerrar perfil" onClick={onClose} />
      <aside id="profile-drawer" className="notification-drawer profile-drawer" role="dialog" aria-modal="true" aria-labelledby="profile-drawer-title">
        <div className="notification-drawer-header">
          <div>
            <span className="notification-drawer-eyebrow">CUENTA</span>
            <h2 id="profile-drawer-title">Mi perfil</h2>
          </div>
          <button type="button" className="icon-button notification-drawer-close" aria-label="Cerrar perfil" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="profile-drawer-content">
          <div className="profile-avatar-editor">
            <div className="profile-avatar-large">{avatarPreview ? <img src={avatarPreview} alt="Foto de perfil" /> : <Icon name="account_circle" className="text-[42px]" />}</div>
            <label className="profile-avatar-action">
              <Icon name="photo_camera" className="text-[17px]" />
              Cambiar foto
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>

          <label className="profile-field">
            <span>Nombre</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          </label>
          <div className="profile-field">
            <span>Correo electrónico</span>
            <p>{user.email ?? 'No disponible'}</p>
          </div>

          <div className="profile-setting">
            <div>
              <strong>Notificaciones</strong>
              <span>Recibir avisos sobre tus propuestas.</span>
            </div>
            <button type="button" role="switch" aria-checked={notificationsEnabled} className={`profile-switch ${notificationsEnabled ? 'is-on' : ''}`} onClick={() => setNotificationsEnabled((current) => !current)}>
              <span />
            </button>
          </div>

          {message && <p className="profile-message" role="status">{message}</p>}
          <button type="button" className="profile-save-button" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          <button type="button" className="profile-signout-button" onClick={() => { void signOut() }}><Icon name="logout" className="text-[18px]" />Cerrar sesión</button>
        </div>
      </aside>
    </>
  )
}

export function Header({ route, title, onOpenSidebar }: HeaderProps) {
  const { user } = useAuth()
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme())
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [openNotifications, setOpenNotifications] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [seenIds, setSeenIds] = useState<string[]>(() => readSeenIds())
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const load = async () => {
      const notificationsResult = await api.getNotifications().catch(() => null)
      if (notificationsResult) setNotifications(notificationsResult.notifications)
    }
    load()
  }, [])

  useEffect(() => {
    if (!openNotifications) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenNotifications(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openNotifications])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!getStoredTheme()) {
        const next = resolveInitialTheme()
        setTheme(next)
        applyTheme(next)
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setStoredTheme(next)
  }

  const openNotificationPanel = () => {
    if (!notificationsEnabled) return
    setOpenNotifications(true)
    setOpenProfile(false)
    const unreadIds = notifications.filter((item) => !seenIds.includes(item.id)).map((item) => item.id)
    if (unreadIds.length > 0) {
      const nextSeen = [...seenIds, ...unreadIds]
      setSeenIds(nextSeen)
      localStorage.setItem(seenNotificationsKey, JSON.stringify(nextSeen))
    }
  }

  const notificationsEnabled = user?.user_metadata?.notifications_enabled !== false
  const unreadCount = notificationsEnabled ? notifications.filter((item) => !seenIds.includes(item.id)).length : 0
  const formattedTime = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(currentTime)
  const profileName = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Usuario'
  const profileAvatar = (user?.user_metadata?.avatar_url as string | undefined)
    ?? (user?.user_metadata?.picture as string | undefined)
  const openProfilePanel = () => {
    setOpenProfile(true)
    setOpenNotifications(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button menu-trigger" onClick={onOpenSidebar} aria-label="Abrir menú"><Icon name="menu" /></button>
        <div><p className="breadcrumb">CloudOps / <span>{labels[route]}</span></p><h1 className="text-gradient">{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <div className="topbar-search"><Icon name="search" /><input aria-label="Buscar" placeholder="Buscar en la propuesta" /></div>
        <time className="header-time" dateTime={currentTime.toISOString()} aria-label={`Hora actual: ${formattedTime}`}><Icon name="schedule" className="text-[17px]" />{formattedTime}</time>
        <div className="header-divider" />
        <button type="button" className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}><Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[19px]" /></button>
        <div className="notification-wrap">
          <button type="button" className="icon-button notification-button" aria-label="Notificaciones" aria-expanded={openNotifications} aria-controls="notification-drawer" disabled={!notificationsEnabled} onClick={openNotificationPanel} title={notificationsEnabled ? 'Notificaciones' : 'Notificaciones deshabilitadas'}><Icon name="notifications" />{unreadCount > 0 && <span />}</button>
          {openNotifications && (
            <>
              <button type="button" className="notification-drawer-backdrop" aria-label="Cerrar notificaciones" onClick={() => setOpenNotifications(false)} />
              <aside id="notification-drawer" className="notification-drawer" role="dialog" aria-modal="true" aria-labelledby="notification-drawer-title">
                <div className="notification-drawer-header">
                  <div>
                    <span className="notification-drawer-eyebrow">ACTIVIDAD</span>
                    <h2 id="notification-drawer-title">Notificaciones</h2>
                  </div>
                  <button type="button" className="icon-button notification-drawer-close" aria-label="Cerrar notificaciones" onClick={() => setOpenNotifications(false)}><Icon name="close" /></button>
                </div>
                <div className="notification-drawer-summary"><span>{unreadCount > 0 ? `${unreadCount} nuevas` : 'Todo al día'}</span></div>
                <div className="notification-drawer-content">
                  {notifications.length > 0 ? notifications.map((item) => (
                    <div key={item.id} className="notification-item">
                      <div className="notification-dot" />
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </div>
                  )) : <p className="notification-empty">No hay notificaciones por ahora.</p>}
                </div>
              </aside>
            </>
          )}
        </div>
        <button type="button" className="header-profile-button" onClick={openProfilePanel} aria-label="Abrir mi perfil" aria-expanded={openProfile} aria-controls="profile-drawer">
          <span className="header-profile-avatar">{profileAvatar ? <img src={profileAvatar} alt="" /> : <Icon name="account_circle" className="text-[21px]" />}</span>
          <span className="header-profile-name">{profileName}</span>
          <Icon name="expand_more" className="text-[17px]" />
        </button>
        {openProfile && <ProfileDrawer onClose={() => setOpenProfile(false)} />}
      </div>
    </header>
  )
}
