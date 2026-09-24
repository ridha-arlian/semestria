<script setup lang="ts" generic="TData extends RowData">
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
  }>()

  const emit = defineEmits<{
    (e: 'row-click', rowData: TData): void
  }>()

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
  <div class="w-full sm:overflow-x-auto">
    <Table class="w-full sm:min-w-160">
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <ContextMenu v-if="hasContextMenu">
              <ContextMenuTrigger as-child>
                <TableRow class="group cursor-pointer border-b border-line transition-colors hover:bg-soft/80 last:border-0" @click="emit('row-click', row.original)">
                  <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3 align-middle sm:px-6 sm:py-4">
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-48">
                <slot name="context-menu" :row="row.original" />
              </ContextMenuContent>
            </ContextMenu>

            <TableRow v-else class="group cursor-pointer border-b border-line transition-colors hover:bg-soft/80 last:border-0" @click="emit('row-click', row.original)">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3 align-middle sm:px-6 sm:py-4">
                <FlexRender :cell="cell" />
              </TableCell>
            </TableRow>
          </template>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center text-xs text-subline">
              {{ emptyText ?? 'No results.' }}
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>