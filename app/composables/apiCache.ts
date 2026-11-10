// Client-side cache for server data.
//
// The workspace/server flow is synchronous: layouts and pages call
// `api.getWorkspaces()` without awaiting. Data is fetched in global
// middleware (`app/middleware/data.global.ts`) and stored in `useState`,
// so every read below is a plain, instant lookup.

import type { Workspace, Task, Material, MaterialActivity, AppSettings } from '~/types'

export function useWorkspaceCache() {
  return useState<Workspace[]>('api-workspaces', () => [])
}

export function useTaskCache() {
  return useState<Task[]>('api-tasks', () => [])
}

export function useMaterialCache() {
  return useState<Material[]>('api-materials', () => [])
}

export function useActivityCache() {
  return useState<Record<number, MaterialActivity[]>>('api-activities', () => ({}))
}

export function useSettingsCache() {
  return useState<AppSettings | null>('api-settings', () => null)
}

export function findWorkspace(slug: string): Workspace | undefined {
  return useWorkspaceCache().value.find((w: Workspace) => w.slug === slug)
}

export function findTasks(workspaceId: number): Task[] {
  return useTaskCache().value.filter((t: Task) => t.workspaceId === workspaceId)
}

export function findMaterials(workspaceId: number): Material[] {
  return useMaterialCache().value.filter((m: Material) => m.workspaceId === workspaceId)
}

export function upsertWorkspace(ws: Workspace): void {
  const cache = useWorkspaceCache()
  const idx = cache.value.findIndex((w: Workspace) => w.id === ws.id)
  cache.value = idx === -1 ? [...cache.value, ws] : cache.value.map((w: Workspace) => (w.id === ws.id ? ws : w))
}

export function removeWorkspaceFromCache(id: number): void {
  const cache = useWorkspaceCache()
  cache.value = cache.value.filter((w: Workspace) => w.id !== id)
  const tasks = useTaskCache()
  tasks.value = tasks.value.filter((t: Task) => t.workspaceId !== id)
  const mats = useMaterialCache()
  mats.value = mats.value.filter((m: Material) => m.workspaceId !== id)
}

export function upsertTask(task: Task): void {
  const cache = useTaskCache()
  const idx = cache.value.findIndex((t: Task) => t.id === task.id)
  cache.value = idx === -1 ? [task, ...cache.value] : cache.value.map((t: Task) => (t.id === task.id ? task : t))
}

export function removeTaskFromCache(id: number): void {
  const cache = useTaskCache()
  cache.value = cache.value.filter((t: Task) => t.id !== id)
}

export function upsertMaterial(mat: Material): void {
  const cache = useMaterialCache()
  const idx = cache.value.findIndex((m: Material) => m.id === mat.id)
  cache.value = idx === -1 ? [mat, ...cache.value] : cache.value.map((m: Material) => (m.id === mat.id ? mat : m))
}

export function removeMaterialFromCache(id: number): void {
  const cache = useMaterialCache()
  cache.value = cache.value.filter((m: Material) => m.id !== id)
}

export function useHydratedCache() {
  return useState<Record<string, boolean>>('api-hydrated', () => ({}))
}

export function useLoadingCache() {
  return useState<Record<string, boolean>>('api-loading', () => ({}))
}

export function useErrorCache() {
  return useState<Record<string, string | null>>('api-errors', () => ({}))
}

export function useFetchedAtCache() {
  return useState<Record<string, number>>('api-fetched-at', () => ({}))
}

export function markLoading(key: string, value: boolean, loading = useLoadingCache()): void {
  loading.value = { ...loading.value, [key]: value }
}

export function setFetchError(key: string, message: string | null, errors = useErrorCache()): void {
  errors.value = { ...errors.value, [key]: message }
}

export function markFetched(key: string, at = Date.now(), fetchedAt = useFetchedAtCache()): void {
  fetchedAt.value = { ...fetchedAt.value, [key]: at }
}

// Pass `fetchedAt` when calling after an `await`: resolving the state ref again
// needs the Nuxt instance, which is gone once the async context is lost.
export function isFresh(key: string, ttlMs = 30_000, fetchedAt = useFetchedAtCache()): boolean {
  const at = fetchedAt.value[key]
  return at !== undefined && Date.now() - at < ttlMs
}

/** Forget every per-key status so the next session starts from a cold cache. */
export function clearCacheStatus(): void {
  useHydratedCache().value = {}
  useLoadingCache().value = {}
  useErrorCache().value = {}
  useFetchedAtCache().value = {}
}

// Fetch functions run in middleware, so they must capture the state ref before
// their first `await`. Callers that can resolve it synchronously may omit it.
export function setHydrated(key: string, hydrated = useHydratedCache()): void {
  hydrated.value = { ...hydrated.value, [key]: true }
}
