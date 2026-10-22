import { columnVisibilityFeature, tableFeatures } from '@tanstack/vue-table'
import type { ColumnDef, RowData } from '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  // The generic parameters must keep their original names for the interface
  // to merge with the one declared by TanStack Table.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TFeatures, TData> {
    onEdit?: (item: TData) => void
    onDelete?: (item: TData) => void
    onChangeStatus?: (item: TData) => void
    onShare?: (item: TData) => void
    onOpenLink?: (item: TData) => void
    onMarkReviewed?: (item: TData) => void
  }
}

export const features = tableFeatures({
  columnVisibilityFeature,
})

export type DataTableFeatures = typeof features

/**
 * Column definitions may mix accessors of different value types, but
 * `ColumnDef` is invariant in `TValue` because header/footer templates are
 * contravariant. Erasing `TValue` to `any` is the only shape that accepts a
 * heterogeneous column array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>
