import { toast } from 'vue-sonner'
import type { Workspace, Task, Material, WorkspaceFormPayload, TaskPayload, MaterialPayload, MaterialActivity, AppSettings, TaskPriority } from '~/types'
import {
  useWorkspaceCache, useTaskCache, useMaterialCache, useActivityCache, useSettingsCache,
  findWorkspace, findTasks, findMaterials, upsertWorkspace, removeWorkspaceFromCache,
  upsertTask, upsertMaterial, clearCacheStatus,
} from './apiCache'

interface ApiError extends Error { statusCode?: number; data?: unknown }

/**
 * Toasts report mutation outcomes. Field-level validation stays inline in the
 * forms, so only failures that would otherwise be silent end up here.
 * The `id` keeps repeated failures for the same entity from stacking.
 */
function fail(message: string, id?: string) {
  toast.error(message, id ? { id } : undefined)
}

function detail(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ''
  return message ? `${prefix}: ${message}` : prefix
}

/** Forms use `''` for "not set"; the API expects `null` for empty optionals. */
function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
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
      const err = e as { data?: { statusMessage?: string, message?: string, issues?: { path: (string | number)[], message: string }[] }, statusMessage?: string, statusCode?: number, response?: { status?: number } }
      // Validation failures carry per-field issues; surface them instead of the
      // generic "Validation failed" so the offending field is obvious.
      const issues = err?.data?.issues
      const message = issues?.length
        ? issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        : err?.data?.statusMessage ?? err?.data?.message ?? err?.statusMessage ?? 'Request failed'
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
    let created: Workspace
    try {
      created = await request<Workspace>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          startDate: orNull(payload.startDate),
          endDate: orNull(payload.endDate),
        }),
      })
    }
    catch (error) {
      fail(detail('Could not create workspace', error), 'workspace-create')
      throw error
    }
    upsertWorkspace(created)
    toast.success('Workspace created')
    return created
  }

  async function updateWorkspace(id: number, payload: WorkspaceFormPayload): Promise<void> {
    let updated: Workspace
    try {
      updated = await request<Workspace>(`/api/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...payload,
          startDate: orNull(payload.startDate),
          endDate: orNull(payload.endDate),
        }),
      })
    }
    catch (error) {
      fail(detail('Could not save workspace', error), `workspace-${id}`)
      throw error
    }
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
      fail('Could not delete workspace. Changes reverted.', 'workspace-delete')
      throw new Error('delete failed')
    }
    toast.success('Workspace deleted')
  }

  async function setActiveWorkspace(id: number): Promise<void> {
    let updated: Workspace
    try {
      updated = await request<Workspace>(`/api/workspaces/${id}/activate`, { method: 'POST' })
    }
    catch (error) {
      fail(detail('Could not switch workspace', error), 'workspace-activate')
      throw error
    }
    upsertWorkspace(updated)
  }

  async function setWorkspaceFocus(id: number, week: number, note: string): Promise<void> {
    let updated: Workspace
    try {
      updated = await request<Workspace>(`/api/workspaces/${id}/focus`, {
        method: 'PATCH',
        body: JSON.stringify({ week, note }),
      })
    }
    catch (error) {
      fail(detail('Could not save the focus note', error), `workspace-focus-${id}`)
      throw error
    }
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
      fail('Could not delete material. Changes reverted.', 'material-delete')
      throw new Error('delete failed')
    }
    toast.success('Material deleted')
  }

  async function addTask(workspaceId: number, payload: TaskPayload): Promise<Task> {
    let created: Task
    try {
      created = await request<Task>(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          due: orNull(payload.due),
          description: orNull(payload.description),
          submissionUrl: orNull(payload.submissionUrl),
        }),
      })
    }
    catch (error) {
      fail(detail('Could not create task', error), 'task-create')
      throw error
    }
    upsertTask(created)
    toast.success('Task created')
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
      fail('Could not delete task. Changes reverted.', 'task-delete')
      throw new Error('delete failed')
    }
    toast.success('Task deleted')
  }

  async function addMaterial(workspaceId: number, payload: MaterialPayload): Promise<Material> {
    let created: Material
    try {
      created = await request<Material>(`/api/workspaces/${workspaceId}/materials`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          url: orNull(payload.url),
        }),
      })
    }
    catch (error) {
      fail(detail('Could not add material', error), 'material-create')
      throw error
    }
    upsertMaterial(created)
    toast.success('Material added')
    return created
  }

  async function patchTask(id: number, patch: { title?: string; course?: string; due?: string; priority?: TaskPriority; description?: string; note?: string; status?: 'To do' | 'In progress' | 'Done' }): Promise<Task> {
    let updated: Task
    try {
      updated = await request<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...patch,
          ...(patch.due !== undefined ? { due: orNull(patch.due) } : {}),
          ...(patch.description !== undefined ? { description: orNull(patch.description) } : {}),
        }),
      })
    }
    catch (error) {
      fail(detail('Could not update task', error), `task-${id}`)
      throw error
    }
    upsertTask(updated)
    return updated
  }

  async function patchMaterial(id: number, patch: { title?: string; course?: string; type?: Material['type']; tags?: string[]; taskId?: number | null }): Promise<Material> {
    let updated: Material
    try {
      updated = await request<Material>(`/api/materials/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    }
    catch (error) {
      fail(detail('Could not update material', error), `material-${id}`)
      throw error
    }
    upsertMaterial(updated)
    return updated
  }

  async function fetchActivities(materialId: number): Promise<MaterialActivity[]> {
    let list: MaterialActivity[]
    try {
      list = await request<MaterialActivity[]>(`/api/materials/${materialId}/activities`)
    }
    catch (error) {
      fail(detail('Could not load activity', error), `activities-${materialId}`)
      throw error
    }
    activitiesState.value = { ...activitiesState.value, [materialId]: list }
    return list
  }

  async function fetchSettings(): Promise<AppSettings | null> {
    let settings: AppSettings
    try {
      settings = await request<AppSettings>('/api/settings')
    }
    catch (error) {
      fail(detail('Could not load settings', error), 'settings-load')
      throw error
    }
    settingsState.value = settings
    return settings
  }

  async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings | null> {
    let updated: AppSettings
    try {
      updated = await request<AppSettings>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    }
    catch (error) {
      fail(detail('Could not save settings', error), 'settings-save')
      throw error
    }
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
    clearCacheStatus()
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
    setWorkspaceFocus,
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
