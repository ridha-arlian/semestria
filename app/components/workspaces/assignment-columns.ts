import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { Dot } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import AssignmentDropdown from './AssignmentDropdown.vue'
import type { Assignment } from '~/types/dashboard'
import type { DataTableFeatures } from '@/components/ui/data-table/features'

type Urgency = { label: string, class: string } | null
const columnHelper = createColumnHelper<DataTableFeatures, Assignment>()

function initials(course: string) {
  return course.split(' ').map(w => w[0]).join('').slice(0, 2)
}

const statusStyles: Record<string, string> = {
  'Not started': 'bg-soft text-status-idle hover:bg-soft',
  'In progress': 'border border-status-progress/30 bg-status-progress/10 text-status-progress hover:bg-status-progress/10',
  'Done': 'border border-status-done/30 bg-status-done/10 text-status-done hover:bg-status-done/10',
}

const priorityDotColor: Record<string, string> = {
  High: 'text-priority-high',
  Medium: 'text-priority-medium',
  Low: 'text-priority-low',
}

function getUrgency(due: string, status: string): Urgency {
  if (status === 'Done') return null
  const dueDate = new Date(due)
  if (Number.isNaN(dueDate.getTime())) return null

  const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Lewat tenggat', class: 'text-urgency-overdue font-medium' }
  if (diffDays === 0) return { label: 'Jatuh tempo', class: 'text-urgency-due font-medium' }
  if (diffDays <= 2) return { label: 'Makin dekat', class: 'text-urgency-due font-medium' }
  return { label: 'Masih lama', class: 'text-urgency-later' }
}

export const assignmentColumns = [
  columnHelper.display({
    id: 'priority',
    header: '',
    cell: ({ row }) => h('div', { class: 'pl-2 sm:pl-2 flex items-center justify-center pt-0.5 sm:pt-0' }, [
      h(Dot, {
        class: `size-4 shrink-0 ${priorityDotColor[row.original.priority] ?? priorityDotColor.Low}`,
        strokeWidth: 8,
      }),
    ]),
  }),

  columnHelper.accessor('task', {
    header: 'Task',
    cell: ({ row }) => {
      const urgency = getUrgency(row.original.due, row.original.status)

      return h('div', { class: 'min-w-0 w-full' }, [
        h('div', { class: 'hidden items-center justify-between gap-3 sm:flex' }, [
          h('div', { class: 'flex min-w-0 items-center gap-2.5' }, [
            h('div', { class: 'grid size-8 shrink-0 place-items-center rounded bg-soft text-[10px] font-bold text-subline' }, initials(row.original.course)),
            h('div', { class: 'min-w-0' }, [
              h('p', { class: 'truncate text-xs font-semibold text-strong' }, row.original.task),
              h('p', { class: 'truncate text-[11px] text-subline' }, row.original.course),
            ]),
          ]),
          h('div', { class: 'flex shrink-0 items-center gap-3' }, [
            h('div', { class: 'flex min-h-8 w-24 flex-col items-end justify-center gap-0.5' }, [
              h('p', { class: 'text-[11px] font-medium text-strong' }, row.original.due),
              urgency
                ? h('p', { class: `text-[10px] ${urgency.class}` }, urgency.label)
                : null,
            ]),
            h('div', { class: 'flex w-20 justify-start' }, [
              h(Badge, {
                class: `rounded-full px-2 py-0.5 text-[9px] font-medium ${statusStyles[row.original.status] ?? statusStyles['Not started']}`,
              }, () => row.original.status),
            ]),
          ]),
        ]),

        h('div', { class: 'min-w-0 space-y-1 sm:hidden' }, [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('p', { class: 'min-w-0 truncate text-xs font-semibold text-strong' }, row.original.task),
            h(Badge, {
              class: `shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusStyles[row.original.status] ?? statusStyles['Not started']}`,
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
      h(AssignmentDropdown, {
        assignment: row.original,
        onChangeStatus: (a: Assignment) => table.options.meta?.onChangeStatus?.(a),
        onShare: (a: Assignment) => table.options.meta?.onShare?.(a),
      }),
    ]),
  }),
]