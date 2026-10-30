import type { JSONContent } from '@tiptap/core'
export type Status = 'In progress' | 'To do' | 'Done'
export type Priority = 'High' | 'Medium' | 'Low'

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

export interface WorkspaceFormPayload {
  name: string
  startDate: string
  endDate: string
  isActive: boolean
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

export interface MaterialLink {
  id: number
  url: string
  label?: string
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
  /** Which kind of content `url` holds. Only Video can be either. */
  contentSource?: 'file' | 'link'
  /** Uploaded-file metadata; survives navigation for the session. */
  fileName?: string
  fileSize?: number
  /** Collection links. */
  links?: MaterialLink[]
  description?: MaterialNote
  taskId?: number
}

export interface MaterialContentInput {
  url: string
  source: 'file' | 'link'
  fileName?: string
  fileSize?: number
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

export type MaterialActivityKind = 'Created' | 'Note updated' | 'File replaced' | 'File removed' | 'Link added' | 'Link updated' | 'Link removed' | 'Content removed' | 'Marked reviewed' | 'Tag added' | 'Task linked' | 'Task unlinked' | 'Edited'

export interface MaterialActivity {
  id: number
  kind: MaterialActivityKind
  label: string
  detail?: string
  at: string
}

export type SettingsSection = 'profile' | 'appearance' | 'notifications' | 'preferences'

export type ThemePresetId = 'mono' | 'ocean' | 'forest' | 'rose' | 'amber' | 'violet' | 'custom'

export type WeekStart = 'monday' | 'sunday'

export type DefaultLanding = 'dashboard' | 'last-active'

export type ReminderLeadTime = '1' | '3' | '7'

export interface SettingsProfile {
  name: string
  email: string
}

export interface SettingsAppearance {
  preset: ThemePresetId
  customColor: string
}

export interface SettingsNotifications {
  deadlineReminders: boolean
  leadTime: ReminderLeadTime
  weeklyDigest: boolean
  materialUpdates: boolean
}

export interface SettingsPreferences {
  weekStartsOn: WeekStart
  activeWorkspaceSlug: string | null
  defaultLanding: DefaultLanding
}

export interface AppSettings {
  profile: SettingsProfile
  appearance: SettingsAppearance
  notifications: SettingsNotifications
  preferences: SettingsPreferences
}