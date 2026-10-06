export type Status = 'In progress' | 'To do' | 'Done'
export type Priority = 'High' | 'Medium' | 'Low'
export type MaterialType = 'Notes' | 'Book' | 'Slides' | 'Collection' | 'Link' | 'PDF' | 'Video'

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
}

export interface Material {
  id: number
  workspaceId: number
  title: string
  course: string
  type: MaterialType
  tags: string
  reviewed: string
  url?: string
  description?: string
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
}

export interface MaterialPayload {
  title: string
  course: string
  type: MaterialType
  url: string
  tags: string[]
  description: string
  taskId: number | null
}