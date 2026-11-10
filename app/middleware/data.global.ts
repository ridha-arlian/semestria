import { fetchWorkspaceList, fetchWorkspaceData, fetchSettings } from '~/composables/useDataFetch'
import { isFresh, useWorkspaceCache } from '~/composables/apiCache'

// SSR awaits every cache so the first HTML is complete. Client navigation
// returns immediately: settings and workspace data load in the background and
// pages show skeletons from `useDataStatus` until the caches hydrate.
export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'

  if (path === '/') return

  const match = path.match(/^\/workspaces\/([^/]+)/)

  if (import.meta.server) {
    // Settings for identity-dependent render (sidebar, header).
    await fetchSettings()

    // Workspace detail pages: load that workspace's tasks/materials.
    if (match) {
      const slug = decodeURIComponent(match[1]!)
      await fetchWorkspaceData(slug)
      return
    }

    // Dashboard: the list endpoint already includes server-derived summaries.
    await fetchWorkspaceList()
    return
  }

  if (!isFresh('settings')) {
    void fetchSettings()
  }

  if (match) {
    const slug = decodeURIComponent(match[1]!)

    // Only the list blocks a cold navigation: `workspace.ts` validates the slug
    // against it, and an empty cache would otherwise 404 a valid workspace.
    // Tasks and materials always resolve in the background.
    const workspaces = useWorkspaceCache()
    if (!workspaces.value.length) {
      await fetchWorkspaceList()
    }
    else if (!isFresh('workspaces')) {
      void fetchWorkspaceList()
    }

    void fetchWorkspaceData(slug)
    return
  }

  if (!isFresh('workspaces')) {
    void fetchWorkspaceList()
  }
})
