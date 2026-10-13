<script setup lang="ts">
import { ArrowUpRight, FileText } from '@lucide/vue'
import type { Material, Task } from '~/types'
import type { TaskDetailContext } from './taskDetailContext.ts'

const props = defineProps<{
  task: Task
}>()

const ctx = inject<TaskDetailContext>('workspace')!
const linkedMaterials = computed(() => ctx.materials.value.filter(m => m.taskId === props.task.id))

function openMaterial(m: Material) {
  if (m.url)
    window.open(m.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Linked materials
      </CardTitle>
      <CardDescription class="mt-0.5 text-xs text-subline">
        Everything attached to this task.
      </CardDescription>
    </CardHeader>
    <CardContent class="p-2">
      <div class="max-h-[150px] space-y-1 overflow-y-auto overscroll-contain">
      <div v-if="linkedMaterials.length > 0">
        <button
          v-for="m in linkedMaterials"
          :key="m.id"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-soft/80"
          @click="openMaterial(m)"
        >
          <div class="grid size-8 shrink-0 place-items-center rounded bg-soft text-subline">
            <FileText class="size-3.5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-text-strong">
              {{ m.title }}
            </p>
            <p class="truncate text-[11px] text-subline">
              {{ m.type }}
            </p>
          </div>
          <ArrowUpRight v-if="m.url" class="size-3.5 shrink-0 text-subline" />
        </button>
      </div>
      <p v-else class="px-2 py-4 text-center text-xs text-subline">
        No linked materials.
      </p>
      </div>
    </CardContent>
  </Card>
</template>
