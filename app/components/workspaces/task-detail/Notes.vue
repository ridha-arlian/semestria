<script setup lang="ts">
import { Check, StickyNote } from '@lucide/vue'
import type { Task } from '~/types'
import type { TaskDetailContext } from './taskDetailContext.ts'

const props = defineProps<{
  task: Task
}>()

const ctx = inject<TaskDetailContext>('workspace')!

const noteDraft = ref('')
const noteJustSaved = ref(false)
let noteSavedTimer: ReturnType<typeof setTimeout> | undefined
const noteDirty = computed(() => noteDraft.value !== (props.task.note ?? ''))

watch(() => props.task.note, (value) => {
  noteDraft.value = value ?? ''
}, { immediate: true })

function saveNote() {
  if (!noteDirty.value)
    return
  ctx.updateNote(props.task, noteDraft.value)
  noteJustSaved.value = true
  if (noteSavedTimer)
    clearTimeout(noteSavedTimer)
  noteSavedTimer = setTimeout(() => {
    noteJustSaved.value = false
  }, 2000)
}

function revertNote() {
  noteDraft.value = props.task.note ?? ''
}

onUnmounted(() => {
  if (noteSavedTimer)
    clearTimeout(noteSavedTimer)
})
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <div>
        <CardTitle class="flex items-center gap-2 text-sm font-semibold text-headline">
          <StickyNote class="size-4 text-subline" />
          Notes
        </CardTitle>
        <CardDescription class="mt-0.5 text-xs text-subline">
          Quick thoughts worth keeping.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent class="space-y-3 p-3">
      <Textarea
        v-model="noteDraft"
        rows="5"
        class="min-h-28 resize-y text-sm"
        placeholder="Write anything worth keeping — decisions, feedback, reminders..."
        @keydown.escape.prevent="revertNote"
        @blur="saveNote"
      />
      <div class="flex items-center justify-between gap-2">
        <p v-if="noteJustSaved" class="flex items-center gap-1 text-[11px] text-text-muted">
          <Check class="size-3" />
          Saved
        </p>
        <p v-else-if="noteDirty" class="text-[11px] text-text-muted">
          Unsaved changes
        </p>
        <span v-else />
        <Button size="sm" :disabled="!noteDirty" @click="saveNote">
          Save note
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
