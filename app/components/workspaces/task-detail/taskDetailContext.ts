import type { Ref } from 'vue'
import type { Material, ModalType, Task, TaskPayload } from '~/types'

/** Workspace-provided operations consumed by the task detail page and its cards. */
export interface TaskDetailContext {
  tasks: Ref<Task[]>
  materials: Ref<Material[]>
  openAdd: (type: ModalType) => void
  updateTask: (id: number, payload: TaskPayload) => void
  cycleStatus: (item: Task) => void
  removeTask: (id: number) => void
  toggleSubtask: (item: Task, subId: number) => void
  addSubtask: (item: Task, title: string) => void
  updateSubtask: (item: Task, subId: number, title: string) => void
  removeSubtask: (item: Task, subId: number) => void
  addSubmissionUrl: (item: Task, url: string) => void
  updateSubmissionUrl: (item: Task, index: number, url: string) => void
  removeSubmissionUrl: (item: Task, index: number) => void
  updateNote: (item: Task, text: string) => void
}
