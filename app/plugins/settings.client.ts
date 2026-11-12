import { useSettings, defaultSettings, SETTINGS_STORAGE_KEY } from '~/composables/useSettings'
import { useSettingsCache } from '~/composables/apiCache'
import type { AppSettings } from '~/types'

export default defineNuxtPlugin((nuxtApp) => {
  const settings = useSettings()
  const api = useApi()
  const route = useRoute()
  const serverSettings = useSettingsCache()
  const { authUser, isDemo } = useDemo()

  let lastActiveSlug = api.getWorkspaces().find(w => w.active)?.slug ?? null
  let ready = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  // Serialized copy of the last state confirmed by the server. Compared against
  // the UI state to skip saves triggered by hydration or route refreshes, and
  // never mutated by UI edits (unlike the settings cache, which used to be
  // shared with the UI state).
  let serverSnapshot: string | null = serverSettings.value
    ? JSON.stringify(serverSettings.value)
    : null

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
    // The sandbox always uses the default theme: the device's saved theme may
    // belong to a previous visitor and must not leak into the demo.
    if (isDemo.value) {
      settings.settings.value = {
        ...settings.settings.value,
        appearance: { ...defaultSettings().appearance },
      }
      return
    }

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
  settings.applyTheme(!isDemo.value)
  // The sandbox hides the avatar and the route would only answer 403.
  if (!isDemo.value)
    void settings.loadAvatar()

  // Starting the demo from the landing page is a client-side navigation, so the
  // plugin may already have hydrated the device's theme. Put the sandbox back on
  // the default palette without touching the device's saved settings.
  watch(isDemo, (demo) => {
    if (!demo)
      return
    settings.settings.value = {
      ...settings.settings.value,
      appearance: { ...defaultSettings().appearance },
    }
    settings.applyTheme(false)
  }, { immediate: true })

  function canSave() {
    // Public pages have no session, the demo is read-only, and an expired
    // session would only earn a 401 toast.
    return ready && Boolean(authUser.value) && !isDemo.value
  }

  function scheduleSave() {
    if (!canSave())
      return
    // Ignore hydration/route refreshes that match what the server already has.
    if (serverSnapshot === null && serverSettings.value)
      serverSnapshot = JSON.stringify(serverSettings.value)

    const current = JSON.stringify(settings.settings.value)
    if (serverSnapshot === current)
      return

    if (saveTimer)
      clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      saveTimer = null
      // Re-check at fire time: logout or expiry may have happened during the
      // debounce, and the demo stays read-only regardless.
      if (!canSave())
        return
      // Re-check the snapshot too: it may have caught up while the debounce
      // was pending (for example after a previous save response).
      const latest = JSON.stringify(settings.settings.value)
      if (serverSnapshot === latest)
        return
      const payload = JSON.parse(latest) as AppSettings
      try {
        const updated = await api.saveSettings(payload, { silent: true })
        if (!updated)
          return
        // Snapshot before assigning the UI state: the deep watcher would
        // otherwise see a change and schedule another save for the same data.
        serverSnapshot = JSON.stringify(updated)
        settings.settings.value = JSON.parse(JSON.stringify(updated)) as AppSettings
      }
      catch {
        // Keep the optimistic UI state; the next change retries the save.
      }
    }, 600)
  }

  watch(settings.settings, () => {
    if (!isDemo.value)
      settings.persist()
    scheduleSave()
  }, { deep: true })

  watch(
    () => [settings.settings.value.appearance.preset, settings.settings.value.appearance.customColor] as const,
    () => settings.applyThemeWithTransition(!isDemo.value),
  )

  // Keep the stored last-active slug in sync with workspace switches. The demo
  // workspace must not write preferences.
  watch(
    () => api.getWorkspaces().find(w => w.active)?.slug ?? null,
    (slug) => {
      if (slug && slug !== lastActiveSlug) {
        lastActiveSlug = slug
        if (!isDemo.value)
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
      const lastActive = api.getWorkspaces().find(w => w.slug === lastActiveSlug)
      if (lastActive)
        navigateTo(`/w/${lastActive.publicId}`)
    }
  })
})
