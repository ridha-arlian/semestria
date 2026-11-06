import { useSettings, SETTINGS_STORAGE_KEY } from '~/composables/useSettings'
import { useSettingsCache } from '~/composables/apiCache'
import type { AppSettings } from '~/types'

export default defineNuxtPlugin((nuxtApp) => {
  const settings = useSettings()
  const api = useApi()
  const route = useRoute()
  const serverSettings = useSettingsCache()

  let lastActiveSlug = api.getWorkspaces().find(w => w.active)?.slug ?? null
  let ready = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function readStored(): Partial<AppSettings> | null {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
      return raw ? JSON.parse(raw) as Partial<AppSettings> : null
    }
    catch (e) {
      console.error('Failed to load settings from localStorage:', e)
      return null
    }
  }

  function hydrate() {
    const stored = readStored()
    if (!stored)
      return
    const current = settings.settings.value

    // Server settings own profile and preferences. localStorage is only a
    // pre-paint cache for appearance.
    if (serverSettings.value) {
      settings.settings.value = {
        ...current,
        appearance: {
          preset: stored.appearance?.preset ?? current.appearance.preset,
          customColor: stored.appearance?.customColor ?? current.appearance.customColor,
        },
      }
      return
    }

    // No server session (public page): keep the old full local fallback so the
    // saved theme still applies before login.
    settings.settings.value = {
      profile: {
        name: stored.profile?.name ?? current.profile.name,
        email: stored.profile?.email ?? current.profile.email,
      },
      appearance: {
        preset: stored.appearance?.preset ?? current.appearance.preset,
        customColor: stored.appearance?.customColor ?? current.appearance.customColor,
      },
      notifications: {
        deadlineReminders: stored.notifications?.deadlineReminders ?? current.notifications.deadlineReminders,
        leadTime: stored.notifications?.leadTime ?? current.notifications.leadTime,
        weeklyDigest: stored.notifications?.weeklyDigest ?? current.notifications.weeklyDigest,
        materialUpdates: stored.notifications?.materialUpdates ?? current.notifications.materialUpdates,
      },
      preferences: {
        weekStartsOn: stored.preferences?.weekStartsOn ?? current.preferences.weekStartsOn,
        activeWorkspaceSlug: stored.preferences?.activeWorkspaceSlug ?? current.preferences.activeWorkspaceSlug,
        defaultLanding: stored.preferences?.defaultLanding ?? current.preferences.defaultLanding,
      },
    }
  }

  // Apply the persisted theme before first paint, then persist and re-apply on change.
  hydrate()
  settings.applyTheme()
  void settings.loadAvatar()

  function scheduleSave() {
    if (!ready)
      return
    // Ignore hydration/route refreshes that match what the server already has.
    const server = serverSettings.value
    if (server && JSON.stringify(server) === JSON.stringify(settings.settings.value))
      return

    if (saveTimer)
      clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void api.saveSettings(settings.settings.value).catch(() => {})
    }, 600)
  }

  watch(settings.settings, () => {
    settings.persist()
    scheduleSave()
  }, { deep: true })

  watch(
    () => [settings.settings.value.appearance.preset, settings.settings.value.appearance.customColor] as const,
    () => settings.applyThemeWithTransition(),
  )

  // Keep the stored last-active slug in sync with workspace switches.
  watch(
    () => api.getWorkspaces().find(w => w.active)?.slug ?? null,
    (slug) => {
      if (slug && slug !== lastActiveSlug) {
        lastActiveSlug = slug
        settings.settings.value.preferences.activeWorkspaceSlug = slug
      }
    },
  )

  // Redirect to the last-active workspace on first load when configured.
  nuxtApp.hook('app:mounted', () => {
    settings.hydrated.value = true
    ready = true
    if (
      settings.settings.value.preferences.defaultLanding === 'last-active'
      && lastActiveSlug
      && (route.path === '/' || route.path === '/dashboard')
    ) {
      navigateTo(`/workspaces/${lastActiveSlug}`)
    }
  })
})
