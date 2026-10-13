import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { Dot, RefreshCcw, Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TasksMobileActions from './TasksMobileActions.vue'
import type { Task } from '~/types'
import type { DataTableFeatures } from '@/components/ui/data-table/features'

type Urgency = { label: string, class: string } | null
const columnHelper = createColumnHelper<DataTableFeatures, Task>()

function initials(course: string) {
  return course.split(' ').map(w => w[0]).join('').slice(0, 2)
}

const statusStyles: Record<string, string> = {
  'To do': 'bg-soft text-status-idle hover:bg-soft',
  'In progress': 'border border-status-progress/30 bg-status-progress/10 text-status-progress hover:bg-status-progress/10',
  'Done': 'border border-status-done/30 bg-status-done/10 text-status-done hover:bg-status-done/10',
}

const priorityDotColor: Record<string, string> = {
  High: 'text-priority-high',
  Medium: 'text-priority-medium',
  Low: 'text-priority-low',
}

function getUrgency(due: string, status: string): Urgency {
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

export const tasksPageColumns = [
  columnHelper.display({
    id: 'priority',
    header: '',
    cell: ({ row }) => h('div', { class: 'grid place-items-center' }, [
      h(Tooltip, {}, () => [
        h(TooltipTrigger, { asChild: true }, () => h(Dot, {
          class: `ml-3 size-4 shrink-0 ${priorityDotColor[row.original.priority] ?? priorityDotColor.Low}`,
          strokeWidth: 8,
        })),
        h(TooltipContent, { side: 'top' }, () => `${row.original.priority} priority`),
      ]),
    ]),
  }),

  columnHelper.accessor('task', {
    header: 'Task',
    cell: ({ row }) => {
      const urgency = getUrgency(row.original.due, row.original.status)

      return h('div', { class: 'min-w-0' }, [
        // Desktop: avatar + title (priority shown by the dot column)
        h('div', { class: 'hidden min-w-0 items-center gap-2.5 sm:flex' }, [
          h('div', { class: 'grid size-8 shrink-0 place-items-center rounded bg-soft text-[10px] font-bold text-subline' }, initials(row.original.course)),
          h('p', { class: 'min-w-0 truncate text-sm font-semibold text-text-strong' }, row.original.task),
        ]),
        // Mobile: title + percent, progress bar, then info (no avatar)
        h('div', { class: 'min-w-0 sm:hidden' }, [
          h('div', { class: 'flex min-w-0 items-center justify-between gap-2' }, [
            h('p', { class: 'min-w-0 truncate text-sm font-semibold text-text-strong' }, row.original.task),
            h('span', { class: 'shrink-0 font-mono text-[11px] text-subline' }, `${row.original.progress}%`),
          ]),
          h('div', { class: 'mt-1.5' }, [
            h(Progress, { modelValue: row.original.progress, class: 'h-1.5 w-full [&_[data-slot=progress-indicator]]:bg-ink' }),
          ]),
          h('div', { class: 'mt-2 flex min-w-0 items-center gap-1.5' }, [
            h('p', { class: 'min-w-0 flex-1 truncate text-[11px] text-subline' }, row.original.course),
            h(Badge, {
              class: `shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusStyles[row.original.status] ?? statusStyles['To do']}`,
            }, () => row.original.status),
          ]),
          h('div', { class: 'mt-1 flex items-center gap-0.5 text-[11px] text-subline' }, [
            h('span', row.original.due),
            urgency
              ? h(Dot, { class: 'size-1.5 shrink-0 text-subline', strokeWidth: 12 })
              : null,
            urgency
              ? h('span', { class: urgency.class }, urgency.label)
              : null,
          ]),
        ]),
      ])
    },
  }),

  columnHelper.accessor('course', {
    header: 'Course',
    cell: ({ row }) => h('span', { class: 'text-sm text-subline' }, row.original.course),
  }),

  columnHelper.accessor('due', {
    header: 'Due date',
    cell: ({ row }) => {
      const urgency = getUrgency(row.original.due, row.original.status)
      return h('div', { class: 'flex min-h-8 flex-col justify-center gap-0.5' }, [
        h('p', { class: 'text-xs font-medium text-text-strong' }, row.original.due),
        urgency
          ? h('p', { class: `text-[11px] ${urgency.class}` }, urgency.label)
          : null,
      ])
    },
  }),

  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ row }) => h(Badge, {
      class: `rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[row.original.status] ?? statusStyles['To do']}`,
    }, () => row.original.status),
  }),

  columnHelper.accessor('progress', {
    header: 'Progress',
    cell: ({ row }) => h('div', { class: 'flex w-full items-center gap-2' }, [
      h(Progress, { modelValue: row.original.progress, class: 'h-1.5 flex-1 [&_[data-slot=progress-indicator]]:bg-ink' }),
      h('span', { class: 'shrink-0 font-mono text-[11px] text-subline' }, `${row.original.progress}%`),
    ]),
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row, table }) => h('div', {
      class: 'flex h-full items-center justify-start gap-0.5',
      onClick: (e: MouseEvent) => e.stopPropagation(),
    }, [
      // Desktop: two inline icon buttons with tooltips
      h('div', { class: 'hidden items-center gap-0.5 sm:flex' }, [
        h(Tooltip, {}, () => [
          h(TooltipTrigger, { asChild: true }, () => h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'size-8 shrink-0 text-subline opacity-0 transition-opacity hover:text-ink group-hover:opacity-100',
            ariaLabel: 'Change status',
            onClick: () => table.options.meta?.onChangeStatus?.(row.original),
          }, () => h(RefreshCcw, { class: 'size-4' }))),
          h(TooltipContent, { side: 'top' }, () => 'Change status'),
        ]),
        h(Tooltip, {}, () => [
          h(TooltipTrigger, { asChild: true }, () => h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'size-8 shrink-0 text-subline opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100',
            ariaLabel: 'Delete task',
            onClick: () => table.options.meta?.onDelete?.(row.original),
          }, () => h(Trash2, { class: 'size-4' }))),
          h(TooltipContent, { side: 'top' }, () => 'Delete task'),
        ]),
      ]),
      // Mobile: single "more" dropdown
      h('div', { class: 'flex items-center sm:hidden' }, [
        h(TasksMobileActions, {
          task: row.original,
          onChangeStatus: (t: Task) => table.options.meta?.onChangeStatus?.(t),
          onDelete: (t: Task) => table.options.meta?.onDelete?.(t),
        }),
      ]),
    ]),
  }),
]