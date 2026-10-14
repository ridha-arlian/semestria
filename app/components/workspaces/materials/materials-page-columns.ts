import { h } from 'vue'
import { createColumnHelper } from '@tanstack/vue-table'
import { FileText } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import MaterialsRowActions from './MaterialsRowActions.vue'
import type { Material } from '~/types'
import type { DataTableFeatures } from '@/components/ui/data-table/features'

const columnHelper = createColumnHelper<DataTableFeatures, Material>()

const MAX_VISIBLE_TAGS = 2

function parseTags(tags: string) {
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

function tagChips(tags: string) {
  const list = parseTags(tags)
  const visible = list.slice(0, MAX_VISIBLE_TAGS)
  const hidden = list.slice(MAX_VISIBLE_TAGS)
  return h('div', { class: 'flex min-w-0 items-center gap-1' }, [
    ...visible.map(tag => h(Tooltip, {}, () => [
      h(TooltipTrigger, { asChild: true }, () => h(Badge, {
        variant: 'outline',
        class: 'max-w-20 shrink-0 cursor-default truncate px-1.5 py-0 font-mono text-[10px] font-normal text-subline',
      }, () => `#${tag}`)),
      h(TooltipContent, { side: 'top' }, () => `#${tag}`),
    ])),
    hidden.length > 0
      ? h(Tooltip, {}, () => [
          h(TooltipTrigger, { asChild: true }, () => h('span', { class: 'shrink-0 cursor-default font-mono text-[10px] text-text-muted' }, `+${hidden.length}`)),
          h(TooltipContent, { side: 'top' }, () => hidden.map(t => `#${t}`).join(' ')),
        ])
      : null,
  ])
}

export const materialsPageColumns = [
  columnHelper.accessor('title', {
    header: 'Material',
    cell: ({ row }) => {
      const item = row.original

      return h('div', { class: 'min-w-0' }, [
        // Desktop: icon + title
        h('div', { class: 'hidden min-w-0 items-center gap-2.5 sm:flex' }, [
          h('div', { class: 'grid size-8 shrink-0 place-items-center rounded bg-soft text-subline' }, [
            h(FileText, { class: 'size-3.5' }),
          ]),
          h('p', { class: 'min-w-0 truncate text-sm font-semibold text-text-strong' }, item.title),
        ]),
        // Mobile: title + type badge, course, tags (no icon, no reviewed date)
        h('div', { class: 'min-w-0 sm:hidden' }, [
          h('div', { class: 'flex min-w-0 items-center gap-1.5' }, [
            h('p', { class: 'min-w-0 truncate text-sm font-semibold text-text-strong' }, item.title),
            h(Badge, { variant: 'outline', class: 'shrink-0 px-1.5 py-0 text-[10px] font-normal text-subline' }, () => item.type),
          ]),
          h('p', { class: 'mt-1 truncate text-[11px] text-subline' }, item.course),
          parseTags(item.tags).length > 0
            ? h('div', { class: 'mt-1' }, [tagChips(item.tags)])
            : null,
        ]),
      ])
    },
  }),

  columnHelper.accessor('course', {
    header: 'Course',
    cell: ({ row }) => h('span', { class: 'text-sm text-subline' }, row.original.course),
  }),

  columnHelper.accessor('type', {
    header: 'Type',
    cell: ({ row }) => h(Badge, {
      variant: 'outline',
      class: 'px-2 py-0.5 text-[10px] font-normal text-subline',
    }, () => row.original.type),
  }),

  columnHelper.accessor('tags', {
    header: 'Tags',
    cell: ({ row }) => tagChips(row.original.tags),
  }),

  columnHelper.accessor('reviewed', {
    header: 'Last reviewed',
    cell: ({ row }) => h('span', { class: 'text-xs text-subline' }, row.original.reviewed),
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      return h('div', {
        class: 'flex h-full items-center justify-end',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      }, [
        h(MaterialsRowActions, {
          material: row.original,
          onOpenLink: (m: Material) => table.options.meta?.onOpenLink?.(m),
          onMarkReviewed: (m: Material) => table.options.meta?.onMarkReviewed?.(m),
          onDelete: (m: Material) => table.options.meta?.onDelete?.(m),
        }),
      ])
    },
  }),
]
