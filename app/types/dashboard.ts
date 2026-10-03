export type Status = 'In progress' | 'To do' | 'Done'
export type Priority = 'High' | 'Medium' | 'Low'
export type MaterialType = 'Notes' | 'Book' | 'Slides' | 'Collection' | 'Link' | 'PDF' | 'Video'

export interface Task {
  id: number
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