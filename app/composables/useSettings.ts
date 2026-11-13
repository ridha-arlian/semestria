import { toast } from 'vue-sonner'
import { buildThemeCss } from '~/utils/settingsTheme'
import type { AppSettings, SettingsSection } from '~/types'

export const SETTINGS_STORAGE_KEY = 'semestria-settings'
export const THEME_CSS_STORAGE_KEY = 'semestria-theme-css'

const SETTINGS_SECTIONS: SettingsSection[] = ['profile', 'appearance', 'notifications', 'preferences', 'account']

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

export function useSettings() {
  const api = useApi()
  const settings = useState<AppSettings>('app-settings', defaultSettings)
  const isOpen = useState<boolean>('app-settings-open', () => false)
  const activeSection = useState<SettingsSection>('app-settings-section', () => 'profile')
  const avatarUrl = useState<string | null>('app-settings-avatar', () => null)
  const hydrated = useState<boolean>('app-settings-hydrated', () => false)

  // The name is edited in the Profile section but saved from a bar rendered by
  // the dialog shell, so the draft lives here instead of inside the section.
  const nameDraft = useState<string>('app-settings-name-draft', () => '')
  const nameBaseline = useState<string>('app-settings-name-baseline', () => '')
  const nameSaving = useState<boolean>('app-settings-name-saving', () => false)
  const nameInitialized = useState<boolean>('app-settings-name-initialized', () => false)

  const displayName = computed(() => settings.value.profile.name.trim() || 'there')
  const firstName = computed(() => displayName.value.trim().split(/\s+/)[0] || 'there')
  const weekStartsOnNumber = computed(() => settings.value.preferences.weekStartsOn === 'sunday' ? 0 : 1)

  const nameError = computed(() => nameDraft.value.trim().length === 0)
  const nameValid = computed(() => !nameError.value && nameDraft.value.trim().length <= 120)
  const nameDirty = computed(() => nameInitialized.value && nameDraft.value.trim() !== nameBaseline.value)

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

  function applyTheme(persist = true) {
    if (!import.meta.client)
      return
    const css = buildThemeCss(settings.value.appearance.preset, settings.value.appearance.customColor)
    let el = document.getElementById('settings-theme') as HTMLStyleElement | null
    if (!css) {
      el?.remove()
      if (persist)
        localStorage.removeItem(THEME_CSS_STORAGE_KEY)
      return
    }
    if (!el) {
      el = document.createElement('style')
      el.id = 'settings-theme'
      document.head.appendChild(el)
    }
    el.textContent = css
    // The demo sandbox must not overwrite the device's saved theme.
    if (persist)
      localStorage.setItem(THEME_CSS_STORAGE_KEY, css)
  }

  function applyThemeWithTransition(persist = true) {
    if (!import.meta.client)
      return
    if (typeof document.startViewTransition === 'function')
      document.startViewTransition(() => applyTheme(persist))
    else
      applyTheme(persist)
  }

  function openSettings(section?: SettingsSection) {
    activeSection.value = section && SETTINGS_SECTIONS.includes(section) ? section : 'profile'
    isOpen.value = true
  }

  function closeSettings() {
    isOpen.value = false
  }

  function initNameDraft() {
    if (nameInitialized.value)
      return
    nameBaseline.value = settings.value.profile.name
    nameDraft.value = settings.value.profile.name
    nameInitialized.value = true
  }

  function discardName() {
    nameDraft.value = nameBaseline.value
    nameInitialized.value = true
  }

  async function saveName() {
    const value = nameDraft.value.trim()
    if (!nameValid.value || !nameDirty.value || nameSaving.value)
      return
    nameSaving.value = true
    try {
      const updated = await api.saveSettings({ profile: { ...settings.value.profile, name: value } })
      if (updated) {
        settings.value = updated
        nameBaseline.value = updated.profile.name
        nameDraft.value = updated.profile.name
        toast.success('Name updated')
      }
    }
    catch {
      // api.saveSettings already reports the failure with the server detail.
    }
    finally {
      nameSaving.value = false
    }
  }

  // A rename that arrives from the server (hydration, another tab) only lands
  // while the draft has no pending edit, so typing is never overwritten.
  watch(() => settings.value.profile.name, (name) => {
    if (!nameInitialized.value || nameDraft.value.trim() !== nameBaseline.value)
      return
    nameBaseline.value = name
    nameDraft.value = name
  })

  // Closing the dialog abandons an unsaved rename so the next open starts clean.
  watch(isOpen, (open) => {
    if (!open)
      discardName()
  })

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
    try {
      const blob = await $fetch<Blob>('/api/me/avatar', { responseType: 'blob' })
      setAvatarBlob(blob)
    }
    catch {
      setAvatarBlob(null)
    }
  }

  return {
    settings,
    isOpen,
    activeSection,
    avatarUrl,
    hydrated,
    displayName,
    firstName,
    weekStartsOnNumber,
    nameDraft,
    nameSaving,
    nameError,
    nameValid,
    nameDirty,
    initNameDraft,
    discardName,
    saveName,
    openSettings,
    closeSettings,
    setAvatarBlob,
    loadAvatar,
    persist,
    applyTheme,
    applyThemeWithTransition,
  }
}
