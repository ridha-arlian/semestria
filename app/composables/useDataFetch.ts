import type { Workspace, Task, Material, MaterialActivity, AppSettings } from '~/types'
import {
  useWorkspaceCache, useTaskCache, useMaterialCache, useActivityCache, useSettingsCache,
  useHydratedCache, setHydrated, useLoadingCache, useErrorCache, markLoading, setFetchError,
  markFetched, isFresh,
} from './apiCache'
import { defaultSettings } from './useSettings'

const PUBLIC_ROUTES = new Set(['/'])

/**
 * Fetches server data into the synchronous caches before any layout or page
 * renders. Runs in global middleware so `app/composables/useApi.ts` getters
 * keep working unchanged.
 *
 * `useRequestFetch` forwards session cookies during SSR; plain `$fetch` would
 * call the handler without the browser's cookies and get 401s.
 *
 * Each fetch is guarded by a 30 s freshness window and an in-flight flag, so a
 * client navigation can call these without awaiting and still avoid duplicate
 * requests. Failures are recorded per key instead of throwing.
 */

/** Only record a fetch error when there is nothing cached to keep showing. */
function failKey(key: string, message: string, hasData: boolean, errors: ReturnType<typeof useErrorCache>) {
  if (!hasData) setFetchError(key, message, errors)
}

export async function fetchWorkspaceList(options: { force?: boolean } = {}) {
  const workspaces = useWorkspaceCache()
  const hydrated = useHydratedCache()
  const loading = useLoadingCache()
  const errors = useErrorCache()
  const request = useRequestFetch()

  if (!options.force && isFresh('workspaces')) return workspaces.value
  if (!options.force && loading.value.workspaces) return workspaces.value

  markLoading('workspaces', true, loading)
  setFetchError('workspaces', null, errors)

  try {
    workspaces.value = await request<Workspace[]>('/api/workspaces')
    setHydrated('workspaces', hydrated)
    markFetched('workspaces')
  }
  catch {
    failKey('workspaces', 'Could not load workspaces.', workspaces.value.length > 0, errors)
  }
  finally {
    markLoading('workspaces', false, loading)
  }

  return workspaces.value
}

/** Initial load for a specific workspace. Called by global middleware. */
export async function fetchWorkspaceData(slug: string, options: { force?: boolean } = {}) {
  const workspaces = useWorkspaceCache()
  const tasks = useTaskCache()
  const materials = useMaterialCache()
  const hydrated = useHydratedCache()
  const loading = useLoadingCache()
  const errors = useErrorCache()
  const request = useRequestFetch()

  // The list resolves the slug, so it must be ready before the workspace key.
  if (!workspaces.value.length && !isFresh('workspaces')) {
    await fetchWorkspaceList()
  }

  const ws = workspaces.value.find(w => w.slug === slug)
  if (!ws) return

  const key = `workspace:${ws.id}`
  if (!options.force && isFresh(key)) return
  if (!options.force && loading.value[key]) return

  markLoading(key, true, loading)
  setFetchError(key, null, errors)

  const hasCached = tasks.value.some(t => t.workspaceId === ws.id)
    || materials.value.some(m => m.workspaceId === ws.id)

  try {
    const [ts, ms] = await Promise.all([
      request<Task[]>(`/api/workspaces/${ws.id}/tasks`),
      request<Material[]>(`/api/workspaces/${ws.id}/materials`),
    ])

    // Merge per workspace: replacing the whole arrays would drop other
    // workspaces' rows while switching quickly.
    tasks.value = [...tasks.value.filter(t => t.workspaceId !== ws.id), ...ts]
    materials.value = [...materials.value.filter(m => m.workspaceId !== ws.id), ...ms]

    setHydrated(key, hydrated)
    markFetched(key)
  }
  catch {
    failKey(key, 'Could not load this workspace.', hasCached, errors)
  }
  finally {
    markLoading(key, false, loading)
  }
}

export async function fetchMaterialActivities(materialId: number) {
  const activities = useActivityCache()
  const request = useRequestFetch()
  activities.value = {
    ...activities.value,
    [materialId]: await request<MaterialActivity[]>(`/api/materials/${materialId}/activities`).catch(() => []),
  }
}

export async function fetchSettings(options: { force?: boolean } = {}) {
  const settings = useSettingsCache()
  const hydrated = useHydratedCache()
  const loading = useLoadingCache()
  const errors = useErrorCache()
  const ui = useState<AppSettings>('app-settings', defaultSettings)
  const request = useRequestFetch()

  if (!options.force && isFresh('settings')) return settings.value
  if (!options.force && loading.value.settings) return settings.value

  markLoading('settings', true, loading)
  setFetchError('settings', null, errors)

  try {
    settings.value = await request<AppSettings>('/api/settings')

    // Mirror into the UI state only on the first load so SSR renders the real
    // name/avatar instead of a placeholder. Later revalidations must not
    // clobber unsaved local edits.
    // Clone deeply: a shallow copy would share nested objects with the server
    // cache, so editing the UI state would silently mutate the cache too and the
    // settings plugin could never detect a change worth saving.
    if (!hydrated.value.settings) {
      ui.value = JSON.parse(JSON.stringify(settings.value)) as AppSettings
    }

    setHydrated('settings', hydrated)
    markFetched('settings')
  }
  catch {
    failKey('settings', 'Could not load your settings.', settings.value !== null, errors)
  }
  finally {
    markLoading('settings', false, loading)
  }

  return settings.value
}

export function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.has(path)
}
