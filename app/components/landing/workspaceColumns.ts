import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { CalendarDays, Dot, MoreHorizontal } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { DataTableFeatures } from '~/components/ui/data-table/features.ts'
import type { Workspace } from '~/types'

const columnHelper = createColumnHelper<DataTableFeatures, Workspace>()

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

// Landing copy of the dashboard columns. The actions cell keeps the same
// More icon but has no dropdown, so the preview stays decorative.
export const columns = [
  columnHelper.accessor('name', {
    header: 'Semester',
    cell: ({ row }) => h('div', {}, [
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

      h('div', { class: 'sm:hidden space-y-1.5 min-w-0 px-2' }, [
        h('div', { class: 'flex items-center justify-between gap-2' }, [
          h('div', { class: 'flex items-center gap-2 min-w-0' }, [
            h('h3', { class: 'text-sm font-semibold text-headline truncate min-w-0' }, row.original.name),
            row.original.active
              ? h(Badge, {
                  variant: 'default',
                  class: 'bg-ink hover:bg-ink text-paper text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full shrink-0'
                }, () => 'CURRENT')
              : null,
          ]),
          h('span', { class: 'text-[11px] font-mono text-subline shrink-0' }, `${row.original.progress}%`),
        ]),
        h(Progress, { modelValue: row.original.progress, class: 'h-1.5 w-full' }),
        h('div', { class: 'flex flex-col gap-1 text-[11px] text-subline' }, [
          h('span', { class: 'flex items-center gap-1.5' }, [
            h(CalendarDays, { class: 'size-3.5' }),
            row.original.dates,
          ]),
          h('span', { class: 'flex items-center' }, [
            h('span', { class: 'truncate' },
              row.original.assignments > 0 ? countLabel(row.original.assignments, 'task', 'tasks') : 'Semester complete'
            ),
            h(Dot, { class: 'size-4 shrink-0 text-text-muted -mx-0.5' }),
            h('span', { class: 'shrink-0' }, countLabel(row.original.courses, 'course', 'courses')),
          ]),
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
        class: 'h-1.5'
      }),
    ]),
  }),

  columnHelper.display({
    id: 'assignments',
    header: 'Tasks',
    cell: ({ row }) => h('div', { class: 'space-y-1' }, [
      h('div', { class: 'flex items-center text-xs font-medium text-text-strong' }, [
        h('span', {}, countLabel(row.original.assignments, 'task', 'tasks')),
        h(Dot, { class: 'size-4 text-text-muted -mx-0.5' }),
        h('span', { class: 'text-subline font-normal' }, countLabel(row.original.courses, 'course', 'courses')),
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
    cell: () => h('div', {
      class: 'flex justify-end pr-2 sm:pr-0',
    }, [
      h('div', {
        class: 'flex size-8 items-center justify-center text-subline opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100',
      }, [
        h(MoreHorizontal, { class: 'size-4' }),
      ]),
    ]),
  }),
]
