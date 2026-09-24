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
  'Not started': 'bg-neutral-100 text-neutral-500 hover:bg-neutral-100',
  'In progress': 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-50',
  'Done': 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50',
}

const priorityDotColor: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-amber-500',
  Low: 'text-neutral-300',
}

function getUrgency(due: string, status: string): Urgency {
  if (status === 'Done') return null
  const dueDate = new Date(due)
  if (Number.isNaN(dueDate.getTime())) return null

  const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Lewat tenggat', class: 'text-red-600' }
  if (diffDays === 0) return { label: 'Jatuh tempo', class: 'text-orange-600' }
  if (diffDays <= 2) return { label: 'Makin dekat', class: 'text-amber-600' }
  return { label: 'Masih lama', class: 'text-neutral-400' }
}

export const assignmentColumns = [
  columnHelper.accessor('task', {
    header: 'Task',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(Dot, { class: `size-4 shrink-0 ${priorityDotColor[row.original.priority] ?? priorityDotColor.Low}`, strokeWidth: 10 }),
      h('div', { class: 'grid size-8 shrink-0 place-items-center rounded bg-neutral-100 text-[10px] font-bold text-neutral-500' }, initials(row.original.course)),
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate text-xs font-semibold' }, row.original.task),
        h('p', { class: 'mt-1 text-[11px] text-neutral-400' }, row.original.course),
      ]),
    ]),
  }),

  columnHelper.display({
    id: 'due',
    header: 'Due',
    cell: ({ row }) => {
      const urgency = getUrgency(row.original.due, row.original.status)
      return h('div', { class: 'hidden flex-col items-end gap-0.5 sm:flex' }, [
        h('p', { class: 'text-[11px] font-medium' }, row.original.due),
        urgency
          ? h('p', { class: `text-[10px] font-medium ${urgency.class}` }, urgency.label)
          : null,
      ])
    },
  }),

  columnHelper.display({
    id: 'status',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(Badge, {
        class: `rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[row.original.status] ?? statusStyles['Not started']}`,
      }, () => row.original.status),
    ]),
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row, table }) => h('div', {
      class: 'flex justify-end',
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