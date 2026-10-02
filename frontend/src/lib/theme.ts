export const themeStorageKey = 'cloudops:theme'

export type ThemeMode = 'light' | 'dark'

export function getStoredTheme(): ThemeMode | null {
  const stored = localStorage.getItem(themeStorageKey)
  return stored === 'light' || stored === 'dark' ? stored : null
}

export function resolveInitialTheme(): ThemeMode {
  return getStoredTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

export function setStoredTheme(mode: ThemeMode): void {
  localStorage.setItem(themeStorageKey, mode)
  applyTheme(mode)
}