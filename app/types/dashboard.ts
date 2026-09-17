export type Status = 'In progress' | 'Not started' | 'Done'
export type Priority = 'High' | 'Medium' | 'Low'

export interface Assignment {
  id: number
  task: string
  course: string
  due: string
  status: Status
  priority: Priority
  progress: number
}

export interface Material {
  id: number
  title: string
  course: string
  type: string
  tags: string
  reviewed: string
}

export type View = 'Overview' | 'Assignments' | 'Materials' | 'All Workspaces'
export type ModalType = 'assignment' | 'material'