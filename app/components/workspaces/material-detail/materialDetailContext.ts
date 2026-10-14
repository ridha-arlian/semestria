import type { Ref } from 'vue'
import type { Material, MaterialActivity, MaterialPayload, ModalType, Task } from '~/types'

/** Workspace-provided operations consumed by the material detail page and its cards. */
export interface MaterialDetailContext {
  tasks: Ref<Task[]>
  materials: Ref<Material[]>
  materialActivities: Ref<Record<number, MaterialActivity[]>>
  openAdd: (type: ModalType) => void
  cycleStatus: (item: Task) => void
  updateMaterial: (id: number, payload: MaterialPayload) => void
  updateMaterialNote: (id: number, text: string) => void
  updateMaterialUrl: (id: number, url: string) => void
  markMaterialReviewed: (id: number) => void
  removeMaterial: (id: number) => void
  pushMaterialActivity: (materialId: number, kind: MaterialActivity['kind'], label: string, detail?: string) => void
  getMaterialActivities: (material: Material) => MaterialActivity[]
}
