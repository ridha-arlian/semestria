import type { TaskPriority } from '~/types'

export type Urgency = { label: string, class: string } | null

export const statusStyles: Record<string, string> = {
  'To do': 'bg-soft text-status-idle hover:bg-soft',
  'In progress': 'border border-status-progress/30 bg-status-progress/10 text-status-progress hover:bg-status-progress/10',
  'Done': 'border border-status-done/30 bg-status-done/10 text-status-done hover:bg-status-done/10',
}

export const priorityDotColor: Record<string, string> = {
  High: 'text-priority-high',
  Medium: 'text-priority-medium',
  Low: 'text-priority-low',
}

export const editPriorities: { value: TaskPriority, label: string, dot: string }[] = [
  { value: 'low', label: 'Low', dot: 'bg-priority-low' },
  { value: 'medium', label: 'Medium', dot: 'bg-priority-medium' },
  { value: 'high', label: 'High', dot: 'bg-priority-high' },
]

export function initials(course: string) {
  return course.split(' ').map(w => w[0]).join('').slice(0, 2)
}

export function getUrgency(due: string, status: string): Urgency {
  if (status === 'Done')
    return null
  const dueDate = new Date(due)
  if (Number.isNaN(dueDate.getTime()))
    return null

  const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0)
    return { label: 'Overdue', class: 'text-urgency-overdue font-medium' }
  if (diffDays === 0)
    return { label: 'Due today', class: 'text-urgency-due font-medium' }
  if (diffDays <= 2)
    return { label: 'Due soon', class: 'text-urgency-due font-medium' }
  return { label: 'Later', class: 'text-urgency-later' }
}
