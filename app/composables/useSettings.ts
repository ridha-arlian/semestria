import { buildThemeCss } from '~/utils/settingsTheme'
import type { AppSettings, SettingsSection } from '~/types'

export const SETTINGS_STORAGE_KEY = 'semestria-settings'
export const THEME_CSS_STORAGE_KEY = 'semestria-theme-css'

const SETTINGS_SECTIONS: SettingsSection[] = ['profile', 'appearance', 'notifications', 'preferences']

export function defaultSettings(): AppSettings {
  return {
    profile: {
      name: 'Ari Rahman',
      email: 'ari.rahman@example.com',
    },
    appearance: {
      preset: 'mono',
      customColor: '#2563eb',
    },
    notifications: {
      deadlineReminders: true,
      leadTime: '3',
      weeklyDigest: false,
      materialUpdates: true,
    },
    preferences: {
      weekStartsOn: 'monday',
      activeWorkspaceSlug: null,
      defaultLanding: 'dashboard',
    },
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useSettings() {
  const settings = useState<AppSettings>('app-settings', defaultSettings)
  const isOpen = useState<boolean>('app-settings-open', () => false)
  const activeSection = useState<SettingsSection>('app-settings-section', () => 'profile')
  const toastMessage = useState<string | null>('app-settings-toast', () => null)
  const avatarUrl = useState<string | null>('app-settings-avatar', () => null)
  const hydrated = useState<boolean>('app-settings-hydrated', () => false)

  // SSR renders the seeded identity; swap in stored settings after mount.
  const displayName = computed(() => hydrated.value ? settings.value.profile.name : 'Ari Rahman')
  const firstName = computed(() => displayName.value.trim().split(/\s+/)[0] || 'there')
  const weekStartsOnNumber = computed(() => settings.value.preferences.weekStartsOn === 'sunday' ? 0 : 1)

  function persist() {
    if (!import.meta.client)
      return
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
    }
    catch (e) {
      console.error('Failed to persist settings:', e)
    }
  }

  function applyTheme() {
    if (!import.meta.client)
      return
    const css = buildThemeCss(settings.value.appearance.preset, settings.value.appearance.customColor)
    let el = document.getElementById('settings-theme') as HTMLStyleElement | null
    if (!css) {
      el?.remove()
      localStorage.removeItem(THEME_CSS_STORAGE_KEY)
      return
    }
    if (!el) {
      el = document.createElement('style')
      el.id = 'settings-theme'
      document.head.appendChild(el)
    }
    el.textContent = css
    localStorage.setItem(THEME_CSS_STORAGE_KEY, css)
  }

  function applyThemeWithTransition() {
    if (!import.meta.client)
      return
    if (typeof document.startViewTransition === 'function')
      document.startViewTransition(() => applyTheme())
    else
      applyTheme()
  }

  function openSettings(section?: SettingsSection) {
    activeSection.value = section && SETTINGS_SECTIONS.includes(section) ? section : 'profile'
    isOpen.value = true
  }

  function closeSettings() {
    isOpen.value = false
  }

  function showToast(message: string) {
    toastMessage.value = message
    if (toastTimer)
      clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastMessage.value = null
    }, 2400)
  }

  // Single owner for the object URL so Settings and Sidebar stay in sync and
  // no blob leaks when the avatar is replaced or removed.
  function setAvatarBlob(blob: Blob | null) {
    if (avatarUrl.value)
      URL.revokeObjectURL(avatarUrl.value)
    avatarUrl.value = blob ? URL.createObjectURL(blob) : null
  }

  return {
    settings,
    isOpen,
    activeSection,
    toastMessage,
    avatarUrl,
    hydrated,
    displayName,
    firstName,
    weekStartsOnNumber,
    openSettings,
    closeSettings,
    showToast,
    setAvatarBlob,
    persist,
    applyTheme,
    applyThemeWithTransition,
  }
}
