import { fetchWorkspaceList, fetchWorkspaceData, fetchSettings } from '~/composables/useDataFetch'

// Hydrate synchronous caches before any layout/page renders.
export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'

  if (path === '/') return

  // Settings for identity-dependent render (sidebar, header).
  await fetchSettings()

  // Workspace detail pages: load that workspace's tasks/materials.
  const match = path.match(/^\/workspaces\/([^/]+)/)
  if (match) {
    const slug = decodeURIComponent(match[1]!)
    await fetchWorkspaceData(slug)
    return
  }

  // Dashboard: the list endpoint already includes server-derived summaries.
  await fetchWorkspaceList()
})
