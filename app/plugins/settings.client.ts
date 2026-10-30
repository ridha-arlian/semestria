import { useSettings, SETTINGS_STORAGE_KEY } from '~/composables/useSettings'
import type { AppSettings } from '~/types'

export default defineNuxtPlugin((nuxtApp) => {
  const settings = useSettings()
  const api = useApi()
  const route = useRoute()

  let lastActiveSlug = api.getWorkspaces().find(w => w.active)?.slug ?? null

  function hydrate() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Partial<AppSettings>
        const current = settings.settings.value
        // Pick known keys only, so fields dropped from AppSettings (e.g. the
        // old `initials`) are discarded instead of leaking back into state.
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
    }
    catch (e) {
      console.error('Failed to load settings from localStorage:', e)
    }
  }

  // Apply the persisted theme before first paint, then persist and re-apply on change.
  hydrate()
  settings.applyTheme()

  watch(settings.settings, () => settings.persist(), { deep: true })
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
    if (
      settings.settings.value.preferences.defaultLanding === 'last-active'
      && lastActiveSlug
      && (route.path === '/' || route.path === '/dashboard')
    ) {
      navigateTo(`/workspaces/${lastActiveSlug}`)
    }
  })
})
