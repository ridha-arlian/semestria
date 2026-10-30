import type { Task, TaskPriority } from '~/types'

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
