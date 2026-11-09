<script setup lang="ts">
import { ArrowUpRight, FileText } from '@lucide/vue'
import type { Material, Task } from '~/types'
import type { TaskDetailContext } from './taskDetailContext.ts'

const props = defineProps<{
  task: Task
}>()

const ctx = inject<TaskDetailContext>('workspace')!
// A material can point at one primary task (`taskId`) while other tasks keep
// the link in their own `materialIds`; both directions must be included.
const linkedMaterials = computed(() => ctx.materials.value.filter(m =>
  m.taskId === props.task.id || props.task.materialIds?.includes(m.id),
))

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
      <div class="flex max-h-37.5 flex-col gap-1 overflow-y-auto overscroll-contain">
      <div v-if="linkedMaterials.length > 0">
        <Item
          v-for="m in linkedMaterials"
          :key="m.id"
          as="button"
          type="button"
          class="w-full flex-nowrap gap-2.5 px-2 py-2 text-left hover:bg-soft/80"
          @click="openMaterial(m)"
        >
          <ItemMedia class="grid size-8 place-items-center rounded bg-soft text-subline">
            <FileText class="size-3.5" />
          </ItemMedia>
          <ItemContent class="min-w-0 gap-0">
            <ItemTitle class="w-full truncate text-xs font-semibold text-text-strong">
              {{ m.title }}
            </ItemTitle>
            <ItemDescription class="line-clamp-1 text-[11px] text-subline">
              {{ m.type }}
            </ItemDescription>
          </ItemContent>
          <ItemActions v-if="m.url">
            <ArrowUpRight class="size-3.5 shrink-0 text-subline" />
          </ItemActions>
        </Item>
      </div>
      <p v-else class="px-2 py-4 text-center text-xs text-subline">
        No linked materials.
      </p>
      </div>
    </CardContent>
  </Card>
</template>
