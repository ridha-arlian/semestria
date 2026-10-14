<script setup lang="ts">
import { SquareCheck } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const linkedTasks = computed(() =>
  ctx.tasks.value.filter(t => t.id === props.material.taskId || t.materialIds?.includes(props.material.id)),
)

function isDone(taskId: number) {
  return linkedTasks.value.find(t => t.id === taskId)?.status === 'Done'
}

function toggleTask(taskId: number) {
  const task = ctx.tasks.value.find(t => t.id === taskId)
  if (task)
    ctx.cycleStatus(task)
}

function openTask(taskId: number) {
  navigateTo(`/workspaces/${slug.value}/tasks/${taskId}`)
}
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Related tasks
      </CardTitle>
      <CardDescription class="mt-0.5 text-xs text-subline">
        Tasks linked to this material.
      </CardDescription>
    </CardHeader>
    <CardContent class="p-2">
      <div v-if="linkedTasks.length > 0" class="max-h-60 space-y-0.5 overflow-y-auto overscroll-contain">
        <div
          v-for="t in linkedTasks"
          :key="t.id"
          class="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-soft/80"
        >
          <Checkbox
            :model-value="isDone(t.id)"
            :aria-label="`Mark ${t.task} as done`"
            @update:model-value="toggleTask(t.id)"
          />
          <button type="button" class="min-w-0 flex-1 text-left" @click="openTask(t.id)">
            <p
              class="truncate text-xs font-semibold text-text-strong"
              :class="isDone(t.id) && 'text-text-muted line-through'"
            >
              {{ t.task }}
            </p>
            <p class="truncate text-[11px] text-subline">
              {{ t.course }} · {{ t.status }}
            </p>
          </button>
        </div>
      </div>
      <div v-else class="flex flex-col items-center px-2 py-6 text-center">
        <SquareCheck class="size-4 text-subline/50" />
        <p class="mt-2 text-xs text-subline">
          No tasks linked
        </p>
      </div>
    </CardContent>
  </Card>
</template>
