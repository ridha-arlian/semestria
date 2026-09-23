<script setup lang="ts" generic="TData extends RowData">
  import type { ColumnDef, RowData } from '@tanstack/vue-table'
  import { FlexRender, useTable } from '@tanstack/vue-table'
  import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
  import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
  import { FolderOpen, CheckCircle2, Pencil, Trash2 } from '@lucide/vue'
  import { features, type DataTableFeatures } from './features'

  const props = defineProps<{
    columns: ColumnDef<DataTableFeatures, TData, any>[]
    data: TData[]
  }>()

  const emit = defineEmits<{
    (e: 'row-click', rowData: TData): void
    (e: 'edit', rowData: TData): void
    (e: 'delete', rowData: TData): void
    (e: 'set-active', rowData: TData): void
  }>()

  const table = useTable({
    features,
    get data() { return props.data },
    get columns() { return props.columns },
    meta: {
      onEdit: (data) => emit('edit', data),
      onDelete: (data) => emit('delete', data),
    },
  })
</script>

<template>
  <div class="w-full overflow-x-auto">
    <Table class="min-w-160 sm:min-w-0">
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <ContextMenu v-for="row in table.getRowModel().rows" :key="row.id">
            <ContextMenuTrigger as-child>
              <TableRow class="group cursor-pointer border-b border-line transition-colors hover:bg-soft/80 last:border-0" @click="emit('row-click', row.original)">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3 align-middle sm:px-6 sm:py-4">
                  <FlexRender :cell="cell" />
                </TableCell>
              </TableRow>
            </ContextMenuTrigger>

            <ContextMenuContent class="w-48">
              <ContextMenuItem class="cursor-pointer text-xs" @select="emit('row-click', row.original)">
                <FolderOpen class="mr-2 size-3.5 text-subline" />
                <span>
                  Open workspace
                </span>
              </ContextMenuItem>

              <ContextMenuItem v-if="!(row.original as any).active" class="cursor-pointer text-xs" @select="emit('set-active', row.original)">
                <CheckCircle2 class="mr-2 size-3.5 text-subline" />
                <span>
                  Set as active
                </span>
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem class="cursor-pointer text-xs" @select="emit('edit', row.original)">
                <Pencil class="mr-2 size-3.5 text-subline" />
                <span>
                  Edit workspace
                </span>
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem class="cursor-pointer text-xs text-destructive focus:text-destructive" @select="emit('delete', row.original)">
                <Trash2 class="mr-2 size-3.5" />
                <span>
                  Delete workspace
                </span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center text-xs text-subline">
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>