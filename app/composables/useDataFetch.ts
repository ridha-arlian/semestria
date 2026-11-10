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
 * Each fetch is guarded by a 30 s freshness window and a client-side in-flight
 * map, so a navigation can start one without awaiting and a second caller
 * shares the same request instead of duplicating it or reading an empty cache.
 * Failures are recorded per key instead of throwing.
 */

const inflight = new Map<string, Promise<unknown>>()

/**
 * Client-only request sharing. The map lives in the browser tab; on the server
 * every request must stay isolated, so calls always run.
 */
function dedupe<T>(key: string, force: boolean, run: () => Promise<T>): Promise<T> {
  if (!import.meta.client)
    return run()

  if (!force) {
    const pending = inflight.get(key) as Promise<T> | undefined
    if (pending) return pending
  }

  const promise = run()

  if (!force) {
    inflight.set(key, promise)
    const clear = () => {
      if (inflight.get(key) === promise) inflight.delete(key)
    }
    promise.then(clear, clear)
  }

  return promise
}

/** Only record a fetch error when there is nothing cached to keep showing. */
function failKey(key: string, message: string, hasData: boolean, errors: ReturnType<typeof useErrorCache>) {
  if (!hasData) setFetchError(key, message, errors)
}

export function fetchWorkspaceList(options: { force?: boolean } = {}) {
  const workspaces = useWorkspaceCache()

  if (!options.force && isFresh('workspaces'))
    return Promise.resolve(workspaces.value)

  const hydrated = useHydratedCache()
  const loading = useLoadingCache()
  const errors = useErrorCache()
  const request = useRequestFetch()

  return dedupe('workspaces', options.force ?? false, async () => {
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
  })
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
  // Sharing the in-flight request keeps a cold navigation from 404ing while
  // the list is still loading.
  if (!workspaces.value.length && !isFresh('workspaces')) {
    await fetchWorkspaceList()
  }

  const ws = workspaces.value.find(w => w.slug === slug)
  if (!ws) return

  const key = `workspace:${ws.id}`
  if (!options.force && isFresh(key)) return

  await dedupe(key, options.force ?? false, async () => {
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
  })
}

export async function fetchMaterialActivities(materialId: number) {
  const activities = useActivityCache()
  const request = useRequestFetch()
  activities.value = {
    ...activities.value,
    [materialId]: await request<MaterialActivity[]>(`/api/materials/${materialId}/activities`).catch(() => []),
  }
}

export function fetchSettings(options: { force?: boolean } = {}) {
  const settings = useSettingsCache()

  if (!options.force && isFresh('settings'))
    return Promise.resolve(settings.value)

  const hydrated = useHydratedCache()
  const loading = useLoadingCache()
  const errors = useErrorCache()
  const ui = useState<AppSettings>('app-settings', defaultSettings)
  const request = useRequestFetch()

  return dedupe('settings', options.force ?? false, async () => {
    markLoading('settings', true, loading)
    setFetchError('settings', null, errors)

    try {
      settings.value = await request<AppSettings>('/api/settings')

      // Mirror into the UI state only on the first load so SSR renders the real
      // name/avatar instead of a placeholder. Later revalidations must not
      // clobber unsaved local edits.
      // Clone deeply: a shallow copy would share nested objects with the server
      // cache, so editing the UI state would silently mutate the cache too and
      // the settings plugin could never detect a change worth saving.
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
  })
}

export function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.has(path)
}
