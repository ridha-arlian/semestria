export type Status = 'In progress' | 'To do' | 'Done'
export type Priority = 'High' | 'Medium' | 'Low'
import type { JSONContent } from '@tiptap/core'

export type MaterialType = 'Notes' | 'Book' | 'Slides' | 'Collection' | 'Link' | 'PDF' | 'Video'

/** Rich-note content: a TipTap JSON document, or a plain string (legacy/seed data). */
export type MaterialNote = string | JSONContent

export interface Workspace {
  id: number
  name: string
  slug: string
  dates: string
  courses: number
  assignments: number
  completed: number
  progress: number
  active: boolean
  next: string
  nextDue: string
  startDate?: string
  endDate?: string
}

export interface Subtask {
  id: number
  title: string
  done: boolean
}

export interface Task {
  id: number
  workspaceId: number
  task: string
  course: string
  due: string
  status: Status
  priority: Priority
  progress: number
  description?: string
  checklist?: Subtask[]
  submissionUrls?: string[]
  note?: string
  materialIds?: number[]
}

export interface Material {
  id: number
  workspaceId: number
  title: string
  course: string
  type: MaterialType
  tags: string
  reviewed: string
  lastOpened?: string
  url?: string
  description?: MaterialNote
  taskId?: number
}

export interface StatItem {
  label: string
  value: string
  note: string
  to?: string | null
}

export interface BreadcrumbEntry {
  label: string
  view?: View
  to?: string
}

export type View = 'Overview' | 'Tasks' | 'Materials' | 'All Workspaces'
export type ModalType = 'task' | 'material'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskPayload {
  title: string
  course: string
  due: string
  priority: TaskPriority
  description: string
  submissionUrl: string
}

export interface MaterialPayload {
  title: string
  course: string
  type: MaterialType
  url: string
  tags: string[]
  taskId: number | null
}

export type MaterialActivityKind = 'Created' | 'Note updated' | 'File replaced' | 'Marked reviewed' | 'Tag added' | 'Task linked' | 'Task unlinked' | 'Edited'

export interface MaterialActivity {
  id: number
  kind: MaterialActivityKind
  label: string
  detail?: string
  at: string
}