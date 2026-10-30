import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { Dot } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TasksRowActions from './TasksRowActions.vue'
import { cn } from '~/lib/utils'
import { getUrgency, priorityDotColor, statusStyles } from '~/utils/taskDisplay'
import type { Task } from '~/types'
import type { DataTableFeatures } from '@/components/ui/data-table/features'

const columnHelper = createColumnHelper<DataTableFeatures, Task>()

export const tasksPageColumns = [
  columnHelper.display({
    id: 'priority',
    header: '',
    cell: ({ row }) => h('div', { class: 'grid place-items-center' }, [
      h(Tooltip, {}, () => [
        h(TooltipTrigger, { asChild: true }, () => h(Dot, {
          class: cn('ml-3 size-4 shrink-0', priorityDotColor[row.original.priority] ?? priorityDotColor.Low),
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
              class: cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium', statusStyles[row.original.status] ?? statusStyles['To do']),
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
          ? h('p', { class: cn('text-[11px]', urgency.class) }, urgency.label)
          : null,
      ])
    },
  }),

  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ row }) => h(Badge, {
      class: cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyles[row.original.status] ?? statusStyles['To do']),
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
      class: 'flex h-full items-center justify-end',
      onClick: (e: MouseEvent) => e.stopPropagation(),
    }, [
      h(TasksRowActions, {
        task: row.original,
        onChangeStatus: (t: Task) => table.options.meta?.onChangeStatus?.(t),
        onDelete: (t: Task) => table.options.meta?.onDelete?.(t),
      }),
    ]),
  }),
]
