<script setup lang="ts" generic="TData extends RowData">
  import { computed, ref, watchEffect, useSlots } from 'vue'
  import { FlexRender, useTable } from '@tanstack/vue-table'
  import type { ColumnDef, RowData, TableMeta, ColumnVisibilityState } from '@tanstack/vue-table'
  import { useMediaQuery } from '@vueuse/core'
  import { features, type DataTableFeatures } from '~/components/ui/data-table/features'

  const props = defineProps<{
    columns: ColumnDef<DataTableFeatures, TData, any>[]
    data: TData[]
    meta?: TableMeta<DataTableFeatures, TData>
    emptyText?: string
    mobileHiddenColumns?: string[]
    showHeader?: boolean
    columnClass?: Record<string, string>
  }>()

  const emit = defineEmits<{
    (e: 'row-click', rowData: TData): void
  }>()

  const defaultWidths: Record<string, string> = {
    priority: 'w-12 shrink-0',
    task: 'w-auto min-w-0',
    actions: 'w-8 shrink-0',
  }

  // Per-column width override. Falls back to the defaults above,
  // then to w-auto for columns without a defined width.
  function widthClass(id: string) {
    return props.columnClass?.[id] ?? defaultWidths[id] ?? 'w-auto'
  }

  const slots = useSlots()
  const hasContextMenu = computed(() => !!slots['context-menu'])

  const isMobile = useMediaQuery('(max-width: 639px)')
  const columnVisibility = ref<ColumnVisibilityState>({})

  watchEffect(() => {
    const hidden = props.mobileHiddenColumns ?? []
    columnVisibility.value = isMobile.value
      ? Object.fromEntries(hidden.map(id => [id, false]))
      : {}
  })

  const table = useTable({
    features,
    get data() { return props.data },
    get columns() { return props.columns },
    meta: props.meta,
    state: {
      get columnVisibility() { return columnVisibility.value },
    },
    onColumnVisibilityChange: (updater) => {
      columnVisibility.value = typeof updater === 'function'
        ? updater(columnVisibility.value)
        : updater
    },
  })
</script>

<template>
  <div class="w-full overflow-hidden">
    <Table class="w-full table-fixed">
      <TableHeader v-if="props.showHeader">
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="border-b border-line hover:bg-transparent"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="`px-4 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.12em] text-subline sm:px-6 ${widthClass(header.column.id)}`"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <ContextMenu v-if="hasContextMenu">
              <ContextMenuTrigger as-child>
                <TableRow class="group cursor-pointer border-b border-line transition-colors hover:bg-soft/80 last:border-0" @click="emit('row-click', row.original)">
                  <TableCell
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    :class="[
                      cell.column.id === 'priority' ? 'px-0 py-3.5 sm:py-4' : 'px-4 py-3.5 sm:px-6 sm:py-4',
                      widthClass(cell.column.id),

                      cell.column.id === 'priority' ? 'align-middle text-center' : '',

                      cell.column.id === 'task' ? 'align-top' : '',

                      cell.column.id === 'actions' ? 'align-middle text-right whitespace-nowrap' : ''
                    ]"
                  >
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-48">
                <slot name="context-menu" :row="row.original" />
              </ContextMenuContent>
            </ContextMenu>

            <TableRow v-else class="group cursor-pointer border-b border-line transition-colors hover:bg-soft/80 last:border-0" @click="emit('row-click', row.original)">
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="[
                    cell.column.id === 'priority' ? 'px-0 py-3.5 sm:py-4' : 'px-4 py-3.5 sm:px-6 sm:py-4',
                    widthClass(cell.column.id),
                    cell.column.id === 'priority' ? 'align-middle' : '',
                    cell.column.id === 'task' ? 'align-top' : '',
                    cell.column.id === 'actions' ? 'align-middle text-right whitespace-nowrap' : ''
                  ]"
                >
                  <FlexRender :cell="cell" />
              </TableCell>
            </TableRow>
          </template>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center text-xs text-subline">
              <slot name="empty">
                {{ emptyText ?? 'No results.' }}
              </slot>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>