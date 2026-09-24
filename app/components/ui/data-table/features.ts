import { columnVisibilityFeature, tableFeatures } from '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  interface TableMeta<TFeatures, TData> {
    onEdit?: (item: TData) => void
    onDelete?: (item: TData) => void
    onChangeStatus?: (item: TData) => void
    onShare?: (item: TData) => void
  }
}

export const features = tableFeatures({
  columnVisibilityFeature,
})

export type DataTableFeatures = typeof features