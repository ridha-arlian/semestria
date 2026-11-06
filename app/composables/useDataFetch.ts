import type { Workspace, Task, Material, MaterialActivity, AppSettings } from '~/types'
import {
  useWorkspaceCache, useTaskCache, useMaterialCache, useActivityCache, useSettingsCache,
  useHydratedCache, setHydrated,
} from './apiCache'
import { defaultSettings } from './useSettings'

const PUBLIC_ROUTES = new Set(['/', '/login'])

/**
 * Fetches server data into the synchronous caches before any layout or page
 * renders. Runs in global middleware so `app/composables/useApi.ts` getters
 * keep working unchanged.
 *
 * `useRequestFetch` forwards session cookies during SSR; plain `$fetch` would
 * call the handler without the browser's cookies and get 401s.
 */
export async function fetchWorkspaceList() {
  const workspaces = useWorkspaceCache()
  const hydrated = useHydratedCache()
  const request = useRequestFetch()
  workspaces.value = await request<Workspace[]>('/api/workspaces').catch(() => [])
  setHydrated('workspaces', hydrated)
  return workspaces.value
}

/** Initial load for a specific workspace. Called by global middleware. */
export async function fetchWorkspaceData(slug: string) {
  const workspaces = useWorkspaceCache()
  const tasks = useTaskCache()
  const materials = useMaterialCache()
  const hydrated = useHydratedCache()
  const request = useRequestFetch()

  // Workspace list is needed for sidebar/dashboard and slug validation.
  if (!workspaces.value.length) {
    workspaces.value = await request<Workspace[]>('/api/workspaces').catch(() => [])
  }

  const ws = workspaces.value.find((w) => w.slug === slug)
  if (!ws) return

  const [ts, ms] = await Promise.all([
    request<Task[]>(`/api/workspaces/${ws.id}/tasks`).catch(() => []),
    request<Material[]>(`/api/workspaces/${ws.id}/materials`).catch(() => []),
  ])

  tasks.value = [...tasks.value.filter((t) => t.workspaceId !== ws.id), ...ts]
  materials.value = [...materials.value.filter((m) => m.workspaceId !== ws.id), ...ms]

  // Activity history is lazy: fetch only for open detail pages.
  setHydrated(`workspace:${ws.id}`, hydrated)
}

export async function fetchMaterialActivities(materialId: number) {
  const activities = useActivityCache()
  const request = useRequestFetch()
  activities.value = {
    ...activities.value,
    [materialId]: await request<MaterialActivity[]>(`/api/materials/${materialId}/activities`).catch(() => []),
  }
}

export async function fetchSettings() {
  const settings = useSettingsCache()
  const ui = useState<AppSettings>('app-settings', defaultSettings)
  const request = useRequestFetch()

  if (!settings.value) {
    settings.value = await request<AppSettings>('/api/settings').catch(() => null)
  }

  // Mirror into the UI state so SSR renders the real name/avatar instead of a
  // placeholder. Client-side local overrides are applied in the settings plugin.
  if (settings.value) {
    ui.value = { ...settings.value }
  }

  return settings.value
}

export function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.has(path)
}
