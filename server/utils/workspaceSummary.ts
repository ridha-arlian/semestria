import type { H3Event } from 'h3'
import { useDb } from './db'

export interface WorkspaceSummary {
  courses: number
  assignments: number
  completed: number
  progress: number
  next: string
  nextDue: string
}

interface SummaryTask {
  workspaceId: number
  course: string
  status: string
  progress: number
  dueDate: Date | null
  title: string
}

interface SummaryMaterial {
  workspaceId: number
  course: string
}

export function emptyWorkspaceSummary(): WorkspaceSummary {
  return {
    courses: 0,
    assignments: 0,
    completed: 0,
    progress: 0,
    next: 'No tasks yet',
    nextDue: '—',
  }
}

function buildSummary(tasks: SummaryTask[], materials: SummaryMaterial[]): WorkspaceSummary {
  const courses = new Set([...tasks, ...materials].map((i) => i.course).filter(Boolean)).size
  const completed = tasks.filter((t) => t.status === 'Done').length
  const progress = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0

  const pending = tasks.filter((t) => t.status !== 'Done')
  const datedNext = pending.find((t) => t.dueDate && !Number.isNaN(new Date(t.dueDate).getTime()))
    ?? pending[0]

  return {
    courses,
    assignments: tasks.length,
    completed,
    progress,
    next: datedNext?.title ?? (tasks.length ? 'Semester complete' : 'No tasks yet'),
    nextDue: datedNext?.dueDate ? shortDueLabel(formatDue(datedNext.dueDate)) : '—',
  }
}

/**
 * Workspace aggregates are derived, never stored — mirrors the previous
 * client-side `summarizeWorkspace` in `app/composables/useApi.ts`.
 */
export async function summarizeWorkspace(event: H3Event, workspaceId: number): Promise<WorkspaceSummary> {
  const db = useDb(event)

  const [tasks, materials] = await Promise.all([
    db.task.findMany({
      where: { workspaceId },
      select: { workspaceId: true, course: true, status: true, progress: true, dueDate: true, title: true },
      orderBy: { dueDate: 'asc' },
    }),
    db.material.findMany({
      where: { workspaceId },
      select: { workspaceId: true, course: true },
    }),
  ])

  return buildSummary(tasks, materials)
}

/** Batch form: two queries for every workspace instead of two per workspace. */
export async function summarizeWorkspaces(
  event: H3Event,
  workspaceIds: number[],
): Promise<Map<number, WorkspaceSummary>> {
  const summaries = new Map<number, WorkspaceSummary>()
  if (!workspaceIds.length)
    return summaries

  const db = useDb(event)
  const [tasks, materials] = await Promise.all([
    db.task.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { workspaceId: true, course: true, status: true, progress: true, dueDate: true, title: true },
      orderBy: { dueDate: 'asc' },
    }),
    db.material.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { workspaceId: true, course: true },
    }),
  ])

  for (const workspaceId of workspaceIds) {
    summaries.set(
      workspaceId,
      buildSummary(
        tasks.filter((task) => task.workspaceId === workspaceId),
        materials.filter((material) => material.workspaceId === workspaceId),
      ),
    )
  }

  return summaries
}

function formatDue(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shortDueLabel(due: string): string {
  return due.replace(/,\s*\d{4}$/, '')
}
