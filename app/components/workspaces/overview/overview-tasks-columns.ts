import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { Dot } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TasksDropdown from './TasksDropdown.vue'
import { cn } from '~/lib/utils'
import { getUrgency, initials, priorityDotColor, statusStyles } from '~/utils/taskDisplay'
import type { Task } from '~/types'
import type { DataTableFeatures } from '@/components/ui/data-table/features'

const columnHelper = createColumnHelper<DataTableFeatures, Task>()

export const overviewTasksColumns = [
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

      return h('div', { class: 'min-w-0 w-full' }, [
        h('div', { class: 'hidden grid-cols-[minmax(0,1fr)_6rem_5rem] items-center gap-4 sm:grid' }, [
          h('div', { class: 'flex min-w-0 items-center gap-2.5' }, [
            h('div', { class: 'grid size-8 shrink-0 place-items-center rounded bg-soft text-[10px] font-bold text-subline' }, initials(row.original.course)),
            h('div', { class: 'min-w-0' }, [
              h('p', { class: 'truncate text-xs font-semibold text-text-strong' }, row.original.task),
              h('p', { class: 'truncate text-[11px] text-subline' }, row.original.course),
            ]),
          ]),
          h('div', { class: 'flex min-h-8 min-w-0 flex-col justify-center gap-0.5' }, [
            h('p', { class: 'truncate text-[11px] font-medium text-text-strong' }, row.original.due),
            urgency
              ? h('p', { class: cn('truncate text-[10px]', urgency.class) }, urgency.label)
              : null,
          ]),
          h(Badge, {
            class: cn('w-fit rounded-full px-2 py-0.5 text-[9px] font-medium', statusStyles[row.original.status] ?? statusStyles['To do']),
          }, () => row.original.status),
        ]),

        h('div', { class: 'flex min-w-0 flex-col gap-1 sm:hidden' }, [
          h('div', { class: 'flex items-start justify-start gap-2' }, [
            h('p', { class: 'min-w-0 truncate text-xs font-semibold text-text-strong' }, row.original.task),
            h(Badge, {
              class: cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', statusStyles[row.original.status] ?? statusStyles['To do']),
            }, () => row.original.status),
          ]),
          h('p', { class: 'truncate text-[11px] text-subline' }, row.original.course),

          h('div', { class: 'flex items-center gap-0.5 text-[10px] text-subline' }, [
            h('span', row.original.due),

            urgency
              ? h(Dot, {
                  class: 'size-1.5 shrink-0 text-subline',
                  strokeWidth: 12,
                })
              : null,

            urgency
              ? h('span', { class: urgency.class }, urgency.label)
              : null,
          ]),
        ]),
      ])
    },
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row, table }) => h('div', {
      class: 'pr-4 sm:pr-6 flex h-full items-center justify-end',
      onClick: (e: MouseEvent) => e.stopPropagation(),
    }, [
      h(TasksDropdown, {
        task: row.original,
        onChangeStatus: (t: Task) => table.options.meta?.onChangeStatus?.(t),
        onShare: (t: Task) => table.options.meta?.onShare?.(t),
      }),
    ]),
  }),
]
