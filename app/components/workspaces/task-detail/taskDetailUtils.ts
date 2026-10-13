import type { Task, TaskPriority } from '~/types'

export const priorityDotColor: Record<string, string> = {
  High: 'text-priority-high',
  Medium: 'text-priority-medium',
  Low: 'text-priority-low',
}

export const editPriorities: { value: TaskPriority, label: string, dot: string }[] = [
  { value: 'low', label: 'Low', dot: 'bg-neutral-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
]

export const taskPriorityToForm: Record<Task['priority'], TaskPriority> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
}

export function displayToISO(display: string) {
  const d = new Date(display)
  if (Number.isNaN(d.getTime()))
    return ''
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}
