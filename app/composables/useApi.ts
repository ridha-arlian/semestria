import type { Workspace, Task, Material, WorkspaceFormPayload, TaskPayload, MaterialPayload, MaterialActivity, AppSettings, TaskPriority } from '~/types'
import {
  useWorkspaceCache, useTaskCache, useMaterialCache, useActivityCache, useSettingsCache,
  findWorkspace, findTasks, findMaterials, upsertWorkspace, removeWorkspaceFromCache,
  upsertTask, upsertMaterial,
} from './apiCache'

interface ApiError extends Error { statusCode?: number; data?: unknown }

let toastHandler: ((msg: string) => void) | null = null

function say(msg: string) {
  toastHandler?.(msg)
}

/** Forms use `''` for "not set"; the API expects `null` for empty optionals. */
function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function setApiToast(handler: (msg: string) => void) {
  toastHandler = handler
}

/**
 * Server-adapter layer.
 *
 * Data is fetched in `app/middleware/data.global.ts` and held in `useState`
 * caches (see `shared/apiCache.ts`), so the synchronous getters below keep
 * working exactly as the old in-memory implementation did. Mutations patch
 * the cache first (optimistic) and revert on failure.
 */
export const useApi = () => {
  const workspacesState = useWorkspaceCache()
  const tasksState = useTaskCache()
  const materialsState = useMaterialCache()
  const activitiesState = useActivityCache()
  const settingsState = useSettingsCache()

  async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    try {
      const method = (init.method ?? 'GET').toUpperCase() as 'GET' | 'POST' | 'PATCH' | 'DELETE'
      const res = await $fetch<unknown>(path as never, {
        method,
        body: (init.body as string | undefined) ?? undefined,
      } as never)
      return res as T
    }
    catch (e) {
      const err = e as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, statusCode?: number, response?: { status?: number } }
      const message = err?.data?.statusMessage ?? err?.data?.message ?? err?.statusMessage ?? 'Request failed'
      const error = new Error(message) as ApiError
      error.statusCode = err?.statusCode ?? err?.response?.status
      error.data = err?.data
      throw error
    }
  }

  // Summaries come from the server list/detail endpoints. Recomputing them
  // here would zero every field until tasks/materials are loaded.
  const getWorkspaces = () => workspacesState.value
  const getWorkspaceBySlug = (slug: string) => findWorkspace(slug)

  const getTasks = (workspaceId: number) => findTasks(workspaceId)
  const getMaterials = (workspaceId: number) => findMaterials(workspaceId)
  const getTaskState = () => tasksState
  const getMaterialState = () => materialsState

  async function addWorkspace(payload: WorkspaceFormPayload): Promise<Workspace> {
    const created = await request<Workspace>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        startDate: orNull(payload.startDate),
        endDate: orNull(payload.endDate),
      }),
    })
    upsertWorkspace(created)
    return created
  }

  async function updateWorkspace(id: number, payload: WorkspaceFormPayload): Promise<void> {
    const updated = await request<Workspace>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...payload,
        startDate: orNull(payload.startDate),
        endDate: orNull(payload.endDate),
      }),
    })
    upsertWorkspace(updated)
  }

  async function removeWorkspace(id: number): Promise<void> {
    const backupWs = workspacesState.value.slice()
    const backupTasks = tasksState.value.slice()
    const backupMats = materialsState.value.slice()
    removeWorkspaceFromCache(id)
    try {
      await request(`/api/workspaces/${id}`, { method: 'DELETE' })
    } catch {
      workspacesState.value = backupWs
      tasksState.value = backupTasks
      materialsState.value = backupMats
      say('Could not delete workspace. Changes reverted.')
      throw new Error('delete failed')
    }
  }

  async function setActiveWorkspace(id: number): Promise<void> {
    const updated = await request<Workspace>(`/api/workspaces/${id}/activate`, { method: 'POST' })
    upsertWorkspace(updated)
  }

  async function removeMaterial(id: number): Promise<void> {
    const backupMats = materialsState.value.slice()
    const backupTasks = tasksState.value.slice()
    materialsState.value = materialsState.value.filter((m) => m.id !== id)
    tasksState.value = tasksState.value.map((t) =>
      t.materialIds?.includes(id)
        ? { ...t, materialIds: t.materialIds.filter((mid) => mid !== id) || undefined }
        : t,
    )
    try {
      await request(`/api/materials/${id}`, { method: 'DELETE' })
    } catch {
      materialsState.value = backupMats
      tasksState.value = backupTasks
      say('Could not delete material. Changes reverted.')
      throw new Error('delete failed')
    }
  }

  async function addTask(workspaceId: number, payload: TaskPayload): Promise<Task> {
    const created = await request<Task>(`/api/workspaces/${workspaceId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        due: orNull(payload.due),
        description: orNull(payload.description),
        submissionUrl: orNull(payload.submissionUrl),
      }),
    })
    upsertTask(created)
    return created
  }

  async function removeTask(id: number): Promise<void> {
    const backupTasks = tasksState.value.slice()
    const backupMats = materialsState.value.slice()
    tasksState.value = tasksState.value.filter((t) => t.id !== id)
    materialsState.value = materialsState.value.map((m) =>
      m.taskId === id ? { ...m, taskId: undefined } : m,
    )
    try {
      await request(`/api/tasks/${id}`, { method: 'DELETE' })
    } catch {
      tasksState.value = backupTasks
      materialsState.value = backupMats
      say('Could not delete task. Changes reverted.')
      throw new Error('delete failed')
    }
  }

  async function addMaterial(workspaceId: number, payload: MaterialPayload): Promise<Material> {
    const created = await request<Material>(`/api/workspaces/${workspaceId}/materials`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        url: orNull(payload.url),
      }),
    })
    upsertMaterial(created)
    return created
  }

  async function patchTask(id: number, patch: { title?: string; course?: string; due?: string; priority?: TaskPriority; description?: string; note?: string; status?: 'To do' | 'In progress' | 'Done' }): Promise<Task> {
    const updated = await request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...patch,
        ...(patch.due !== undefined ? { due: orNull(patch.due) } : {}),
        ...(patch.description !== undefined ? { description: orNull(patch.description) } : {}),
      }),
    })
    upsertTask(updated)
    return updated
  }

  async function patchMaterial(id: number, patch: { title?: string; course?: string; type?: Material['type']; tags?: string[]; taskId?: number | null }): Promise<Material> {
    const updated = await request<Material>(`/api/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    upsertMaterial(updated)
    return updated
  }

  async function fetchActivities(materialId: number): Promise<MaterialActivity[]> {
    const list = await request<MaterialActivity[]>(`/api/materials/${materialId}/activities`)
    activitiesState.value = { ...activitiesState.value, [materialId]: list }
    return list
  }

  async function fetchSettings(): Promise<AppSettings | null> {
    const settings = await request<AppSettings>('/api/settings')
    settingsState.value = settings
    return settings
  }

  async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings | null> {
    const updated = await request<AppSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    settingsState.value = updated
    return updated
  }

  /** Clears session and every client cache; callers redirect to the landing page. */
  async function logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => {})
    workspacesState.value = []
    tasksState.value = []
    materialsState.value = []
    activitiesState.value = {}
    settingsState.value = null
    useState<{ id: string } | null>('auth-user', () => null).value = null
  }

  return {
    getWorkspaces,
    getWorkspaceBySlug,
    getTasks,
    getMaterials,
    getTaskState,
    getMaterialState,
    addWorkspace,
    updateWorkspace,
    removeWorkspace,
    setActiveWorkspace,
    removeMaterial,
    addTask,
    removeTask,
    addMaterial,
    // New async helpers used by the layout/persistence layer.
    request,
    patchTask,
    patchMaterial,
    fetchActivities,
    fetchSettings,
    saveSettings,
    logout,
    getActivities: (materialId: number) => activitiesState.value[materialId] ?? [],
  }
}
