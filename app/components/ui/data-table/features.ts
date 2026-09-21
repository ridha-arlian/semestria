import { columnVisibilityFeature, tableFeatures } from '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  interface TableMeta<TFeatures, TData> {
    onEdit?: (workspace: TData) => void
    onDelete?: (workspace: TData) => void
  }
}

export const features = tableFeatures({
  columnVisibilityFeature,
})

export type DataTableFeatures = typeof features