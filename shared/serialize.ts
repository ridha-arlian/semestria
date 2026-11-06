// Pure mapping between Prisma rows and the app's existing display types.
// Imported by both server handlers and the client adapter.

import type { Workspace, Task, Material, MaterialActivity, AppSettings, MaterialNote } from '~/types'

// Structural shapes for the Prisma rows these mappers receive. Kept local so
// the shared module stays independent of the generated Prisma client.
interface WorkspaceRow {
  id: number
  name: string
  slug: string
  startDate: Date | string | null
  endDate: Date | string | null
  isActive: boolean
}

interface ChecklistRow {
  id: number
  title: string
  done: boolean
}

interface SubmissionRow {
  url: string
}

interface TaskMaterialRow {
  materialId: number
}

interface TaskRow {
  id: number
  workspaceId: number
  title: string
  course: string
  dueDate: Date | string | null
  status: string
  priority: string
  progress: number
  description: string | null
  note: string | null
  checklist?: ChecklistRow[] | null
  submissions?: SubmissionRow[] | null
  materials?: TaskMaterialRow[] | null
}

interface MaterialTagRow {
  tag: string
}

interface MaterialLinkRow {
  id: number
  url: string
  label: string | null
}

interface MaterialTaskRow {
  taskId: number
}

interface MaterialRow {
  id: number
  workspaceId: number
  title: string
  course: string
  type: string
  note: unknown
  storageProvider: string | null
  storageKey: string | null
  contentUrl: string | null
  reviewedAt: Date | string | null
  lastOpenedAt: Date | string | null
  fileName: string | null
  fileSize: number | null
  tags?: MaterialTagRow[] | null
  links?: MaterialLinkRow[] | null
  tasks?: MaterialTaskRow[] | null
}

interface ActivityRow {
  id: number
  kind: string
  label: string
  detail: string | null
  at: Date | string
}

interface SettingsUserRow {
  name: string
  email: string
}

interface SettingsRow {
  preset: string
  customColor: string
  deadlineReminders: boolean
  leadTime: string
  weeklyDigest: boolean
  materialUpdates: boolean
  weekStartsOn: string
  defaultLanding: string
  activeWorkspaceSlug: string | null
}

export function isoDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export function formatDueLabel(iso: string): string {
  if (!iso) return 'No due date'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dateRangeLabel(start?: string, end?: string): string {
  if (start && end) return `${formatShortDate(start)} — ${formatShortDate(end)}`
  if (start) return formatShortDate(start)
  return 'Ongoing'
}

export function shortDueLabel(due: string): string {
  return due.replace(/,\s*\d{4}$/, '')
}

export function toWorkspace(row: WorkspaceRow, summary: { courses: number; assignments: number; completed: number; progress: number; next: string; nextDue: string }): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    dates: dateRangeLabel(row.startDate ? isoDate(row.startDate) : undefined, row.endDate ? isoDate(row.endDate) : undefined),
    startDate: row.startDate ? isoDate(row.startDate) : undefined,
    endDate: row.endDate ? isoDate(row.endDate) : undefined,
    active: row.isActive,
    ...summary,
  }
}

export function toTask(row: TaskRow): Task {
  const dueIso = row.dueDate ? isoDate(row.dueDate) : ''
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    task: row.title,
    course: row.course,
    due: formatDueLabel(dueIso),
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    progress: row.progress,
    description: row.description ?? undefined,
    note: row.note ?? undefined,
    checklist: (row.checklist ?? []).map(c => ({ id: c.id, title: c.title, done: c.done })),
    submissionUrls: row.submissions?.length ? row.submissions.map(s => s.url) : undefined,
    materialIds: row.materials?.length ? row.materials.map(m => m.materialId) : undefined,
  }
}

export function displayUrl(row: Pick<MaterialRow, 'storageProvider' | 'contentUrl' | 'storageKey'>): string | undefined {
  if (!row.storageProvider) return undefined
  if (row.storageProvider === 'external') return row.contentUrl ?? undefined
  // R2 object: uploaded directly to storage; the download URL is served via
  // /api/files/:key so ownership is enforced before bytes leave R2.
  return `/api/files/${encodeURIComponent(row.storageKey ?? '')}`
}

export function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    course: row.course,
    type: row.type as Material['type'],
    tags: (row.tags ?? []).map(t => t.tag).join(', '),
    reviewed: row.reviewedAt ? relativeLabel(row.reviewedAt) : '',
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : undefined,
    lastOpened: row.lastOpenedAt ? relativeLabel(row.lastOpenedAt) : undefined,
    url: displayUrl(row),
    contentSource: row.storageProvider === 'external' ? 'link' : row.storageProvider === 'r2' ? 'file' : undefined,
    fileName: row.fileName ?? undefined,
    fileSize: row.fileSize ?? undefined,
    links: (row.links ?? []).map(l => ({ id: l.id, url: l.url, label: l.label ?? undefined })),
    description: (row.note as MaterialNote) ?? undefined,
    taskId: row.tasks?.[0]?.taskId ?? undefined,
  }
}

export function toActivity(row: ActivityRow): MaterialActivity {
  return {
    id: row.id,
    kind: row.kind as MaterialActivity['kind'],
    label: row.label,
    detail: row.detail ?? undefined,
    at: relativeLabel(row.at),
  }
}

export function relativeLabel(d: Date | string): string {
  const then = new Date(d).getTime()
  const diff = Date.now() - then
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.round(diff / 86400000)}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function toSettings(user: SettingsUserRow | null | undefined, s: SettingsRow | null | undefined): AppSettings {
  return {
    profile: { name: user?.name ?? '', email: user?.email ?? '' },
    appearance: { preset: (s?.preset ?? 'mono') as AppSettings['appearance']['preset'], customColor: s?.customColor ?? '#2563eb' },
    notifications: {
      deadlineReminders: s?.deadlineReminders ?? true,
      leadTime: (s?.leadTime ?? '3') as '1' | '3' | '7',
      weeklyDigest: s?.weeklyDigest ?? false,
      materialUpdates: s?.materialUpdates ?? true,
    },
    preferences: {
      weekStartsOn: (s?.weekStartsOn ?? 'monday') as 'monday' | 'sunday',
      defaultLanding: (s?.defaultLanding ?? 'dashboard') as 'dashboard' | 'last-active',
      activeWorkspaceSlug: s?.activeWorkspaceSlug ?? null,
    },
  }
}
