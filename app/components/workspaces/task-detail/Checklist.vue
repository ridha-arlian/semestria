<script setup lang="ts">
import { ListChecks, Pencil, Plus, X } from '@lucide/vue'
import type { Subtask, Task } from '~/types'
import type { TaskDetailContext } from './taskDetailContext.ts'

const props = defineProps<{
  task: Task
}>()

const ctx = inject<TaskDetailContext>('workspace')!
const task = toRef(props, 'task')

const checklist = computed<Subtask[]>(() => task.value?.checklist ?? [])
const doneCount = computed(() => checklist.value.filter(s => s.done).length)
const fractionLabel = computed(() => checklist.value.length === 0 ? '–' : `${doneCount.value}/${checklist.value.length}`)

const newItem = ref('')

const subEdit = useInlineEdit('editInput', (id, value) => {
  if (task.value)
    ctx.updateSubtask(task.value, id, value)
})
const { editingId: editingSubId, draft: editingTitle } = subEdit

function startEditSub(sub: Subtask) {
  subEdit.start(sub.id, sub.title)
}

function toggleRow(subId: number, e?: Event) {
  if (subEdit.isEditing.value || !task.value)
    return
  const target = e?.target as HTMLElement | undefined
  if (target?.closest?.('button, input, textarea, [contenteditable="true"]'))
    return
  ctx.toggleSubtask(task.value, subId)
}

function handleAddItem() {
  if (task.value && newItem.value.trim()) {
    ctx.addSubtask(task.value, newItem.value)
    newItem.value = ''
  }
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement | null
  if (subEdit.isEditing.value && !target?.closest?.('[data-editing-row]'))
    subEdit.save()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <div class="flex items-center justify-between gap-3">
        <div>
          <CardTitle class="flex items-center gap-2 text-sm font-semibold text-headline">
            <ListChecks class="size-4 text-subline" />
            Checklist
          </CardTitle>
          <CardDescription class="mt-0.5 text-xs text-subline">
            Break the work into smaller steps.
          </CardDescription>
        </div>
        <span class="shrink-0 font-mono text-xs text-subline">{{ fractionLabel }}</span>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <Progress :model-value="task.progress" class="h-1.5 flex-1" />
        <span class="shrink-0 font-mono text-[11px] text-subline">{{ task.progress }}%</span>
      </div>
    </CardHeader>
    <CardContent class="flex min-h-92 flex-col gap-2 p-2">
      <div class="max-h-75 space-y-2 overflow-y-auto overscroll-contain">
        <div
          v-for="sub in checklist"
          :key="sub.id"
          role="checkbox"
          :aria-checked="sub.done"
          tabindex="0"
          :data-editing-row="editingSubId === sub.id ? '' : undefined"
          class="group flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-soft/80"
          @click="toggleRow(sub.id, $event)"
          @keydown.enter.prevent="toggleRow(sub.id, $event)"
          @keydown.space.prevent="toggleRow(sub.id, $event)"
        >
          <Checkbox
            :model-value="sub.done"
            tabindex="-1"
            class="pointer-events-none"
          />
          <Input
            v-if="editingSubId === sub.id"
            ref="editInput"
            v-model="editingTitle"
            class="h-7 flex-1 text-sm"
            @click.stop
            @keydown.enter.stop.prevent="subEdit.save"
            @keydown.escape.stop.prevent="subEdit.cancel"
            @keydown.space.stop
            @blur="subEdit.save"
          />
          <span
            v-else
            class="min-w-0 flex-1 truncate text-sm"
            :class="sub.done ? 'text-text-muted line-through' : 'text-text-strong'"
          >
            {{ sub.title }}
          </span>
          <div v-if="editingSubId !== sub.id" class="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-subline opacity-0 transition-opacity hover:text-headline group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              :aria-label="`Edit ${sub.title}`"
              @click.stop="startEditSub(sub)"
            >
              <Pencil class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-subline opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              :aria-label="`Delete ${sub.title}`"
              @click.stop="ctx.removeSubtask(task, sub.id)"
            >
              <X class="size-3.5" />
            </Button>
          </div>
        </div>
        <p v-if="checklist.length === 0" class="px-2 py-4 text-center text-xs text-subline">
          No checklist items yet — add the first step below.
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2 px-2 pb-1 pt-2">
        <Input
          v-model="newItem"
          class="h-8 text-xs"
          placeholder="Add a step and press Enter..."
          @keydown.enter.prevent="handleAddItem"
        />
        <Button size="icon" class="size-8 shrink-0" aria-label="Add checklist item" @click="handleAddItem">
          <Plus class="size-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
