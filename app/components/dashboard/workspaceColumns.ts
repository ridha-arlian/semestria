import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { CalendarDays, Dot } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import DataTableDropdown from '~/components/dashboard/DataTableDropDown.vue'
import type { DataTableFeatures } from '~/components/ui/data-table/features.ts'

export interface Workspace {
  name: string
  dates: string
  courses: number
  assignments: number
  completed: number
  progress: number
  active: boolean
  next: string
  nextDue: string
}

const columnHelper = createColumnHelper<DataTableFeatures, Workspace>()

export const columns = [
  columnHelper.accessor('name', {
    header: 'Semester',
    cell: ({ row }) => h('div', {}, [
      // Desktop
      h('div', { class: 'hidden sm:block' }, [
        h('div', { class: 'flex items-center gap-2.5' }, [
          h('h3', { class: 'text-sm font-semibold text-headline' }, row.original.name),
          row.original.active
            ? h(Badge, {
                variant: 'default',
                class: 'bg-ink hover:bg-ink text-paper text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full'
              }, () => 'CURRENT')
            : null,
        ]),
        h('p', { class: 'mt-1.5 flex items-center gap-1.5 text-[11px] text-subline' }, [
          h(CalendarDays, { class: 'size-3.5' }),
          row.original.dates,
        ]),
      ]),

      // Mobile: 3 baris
      h('div', { class: 'sm:hidden space-y-1.5 min-w-0' }, [
        h('div', { class: 'flex items-center justify-between gap-2' }, [
          h('div', { class: 'flex items-center gap-2 min-w-0' }, [
            h('h3', { class: 'text-sm font-semibold text-headline truncate' }, row.original.name),
            row.original.active
              ? h(Badge, {
                  variant: 'default',
                  class: 'bg-ink hover:bg-ink text-paper text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full shrink-0'
                }, () => 'CURRENT')
              : null,
          ]),
          h('span', { class: 'text-[11px] font-mono text-subline shrink-0' }, `${row.original.progress}%`),
        ]),
        h(Progress, { modelValue: row.original.progress, class: 'h-1.5 bg-soft w-full' }),
        h('div', { class: 'flex items-center justify-between gap-2 text-[11px] text-subline' }, [
          h('span', { class: 'flex items-center gap-1.5 shrink-0' }, [
            h(CalendarDays, { class: 'size-3.5' }),
            row.original.dates,
          ]),
          h('span', { class: 'truncate min-w-0' },
            row.original.assignments > 0 ? `${row.original.assignments} assignments` : 'Semester complete'
          ),
        ]),
      ]),
    ]),
  }),

  columnHelper.accessor('progress', {
    header: 'Progress',
    cell: ({ row }) => h('div', { class: 'min-w-32 sm:min-w-44' }, [
      h('div', { class: 'flex justify-between text-[11px] text-subline mb-1.5' }, [
        h('span', {}, 'Progress'),
        h('span', { class: 'font-mono' }, `${row.original.progress}%`),
      ]),
      h(Progress, {
        modelValue: row.original.progress,
        class: 'h-1.5 bg-soft'
      }),
    ]),
  }),

  columnHelper.display({
    id: 'assignments',
    header: 'Assignments',
    cell: ({ row }) => h('div', { class: 'space-y-1' }, [
      h('div', { class: 'flex items-center text-xs font-medium text-strong' }, [
        h('span', {}, `${row.original.assignments} assignments`),
        h(Dot, { class: 'size-4 text-muted -mx-0.5' }),
        h('span', { class: 'text-subline font-normal' }, `${row.original.courses} courses`),
      ]),

      h('div', { class: 'flex items-center gap-1.5 text-[11px]' }, [
        row.original.nextDue !== '—'
          ? h(Badge, { variant: 'outline', class: 'shrink-0 text-[10px] px-1.5 py-0 font-normal text-subline border-line' },
              () => `Due ${row.original.nextDue}`)
          : null,
        h('span', { class: 'text-subline truncate max-w-28 sm:max-w-48' }, row.original.next),
      ]),
    ]),
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row, table }) => h('div', {
      class: 'flex justify-end',
      onClick: (e: MouseEvent) => e.stopPropagation()
    }, [
      h(DataTableDropdown, {
        workspace: row.original,
        onEdit: (workspace: Workspace) => {
          table.options.meta?.onEdit?.(workspace)
        },
        onDelete: (workspace: Workspace) => {
          table.options.meta?.onDelete?.(workspace)
        }
      })
    ]),
  }),
]