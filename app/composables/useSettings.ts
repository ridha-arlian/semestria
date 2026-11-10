import { buildThemeCss } from '~/utils/settingsTheme'
import type { AppSettings, SettingsSection } from '~/types'

export const SETTINGS_STORAGE_KEY = 'semestria-settings'
export const THEME_CSS_STORAGE_KEY = 'semestria-theme-css'

const SETTINGS_SECTIONS: SettingsSection[] = ['profile', 'appearance', 'notifications', 'preferences']

export function defaultSettings(): AppSettings {
  return {
    profile: {
      name: '',
      email: '',
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
  const avatarLoading = useState<boolean>('app-settings-avatar-loading', () => false)
  const hydrated = useState<boolean>('app-settings-hydrated', () => false)

  const displayName = computed(() => settings.value.profile.name.trim() || 'there')
  const firstName = computed(() => displayName.value.trim().split(/\s+/)[0] || 'there')
  const weekStartsOnNumber = computed(() => settings.value.preferences.weekStartsOn === 'sunday' ? 0 : 1)

  function persist() {
    if (!import.meta.client)
      return
    try {
      // Profile/preferences live on the server. Cache only what must paint
      // before hydration and must not leak between accounts on shared devices.
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        appearance: settings.value.appearance,
      }))
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

  // The avatar route is private, so fetch it as a blob instead of pointing
  // <img> at it: a shared cache must never retain another user's picture.
  async function loadAvatar() {
    if (!import.meta.client)
      return
    avatarLoading.value = true
    try {
      const blob = await $fetch<Blob>('/api/me/avatar', { responseType: 'blob' })
      setAvatarBlob(blob)
    }
    catch {
      setAvatarBlob(null)
    }
    finally {
      avatarLoading.value = false
    }
  }

  return {
    settings,
    isOpen,
    activeSection,
    toastMessage,
    avatarUrl,
    avatarLoading,
    hydrated,
    displayName,
    firstName,
    weekStartsOnNumber,
    openSettings,
    closeSettings,
    showToast,
    setAvatarBlob,
    loadAvatar,
    persist,
    applyTheme,
    applyThemeWithTransition,
  }
}
