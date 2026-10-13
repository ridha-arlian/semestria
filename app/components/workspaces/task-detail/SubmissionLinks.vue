<script setup lang="ts">
import { Link2, Pencil, Plus, X } from '@lucide/vue'
import type { Task } from '~/types'
import type { TaskDetailContext } from './taskDetailContext.ts'

const props = defineProps<{
  task: Task
}>()

const ctx = inject<TaskDetailContext>('workspace')!
const task = toRef(props, 'task')

const links = computed<string[]>(() => task.value?.submissionUrls ?? [])
const newLink = ref('')
const linkEdit = useInlineEdit('editLinkInput', (index, value) => {
  if (task.value)
    ctx.updateSubmissionUrl(task.value, index, value)
})
const { editingId: editingLinkIndex, draft: editingLinkValue } = linkEdit

function handleAddLink() {
  if (task.value && newLink.value.trim()) {
    ctx.addSubmissionUrl(task.value, newLink.value)
    newLink.value = ''
  }
}

function startEditLink(index: number, url: string) {
  linkEdit.start(index, url)
}

function openSubmissionUrl(url: string) {
  if (url.trim())
    window.open(url, '_blank', 'noopener,noreferrer')
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement | null
  if (linkEdit.isEditing.value && !target?.closest?.('[data-editing-link]'))
    linkEdit.save()
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
      <div>
        <CardTitle class="flex items-center gap-2 text-sm font-semibold text-headline">
          <Link2 class="size-4 text-subline" />
          Submit assignment
        </CardTitle>
        <CardDescription class="mt-0.5 text-xs text-subline">
          Where this work should be submitted.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent class="space-y-2 p-2">
      <div class="max-h-37 space-y-2 overflow-y-auto overscroll-contain">
        <div
          v-for="(url, i) in links"
        :key="`${i}-${url}`"
        role="link"
        tabindex="0"
        :aria-label="url"
        :data-editing-link="editingLinkIndex === i ? '' : undefined"
        class="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-soft/80"
        :class="editingLinkIndex === i ? '' : 'cursor-pointer'"
        @click="editingLinkIndex === i ? undefined : openSubmissionUrl(url)"
        @keydown.enter.prevent="editingLinkIndex === i ? undefined : openSubmissionUrl(url)"
      >
        <Link2 class="size-3.5 shrink-0 text-subline" />
        <Input
          v-if="editingLinkIndex === i"
          ref="editLinkInput"
          v-model="editingLinkValue"
          type="url"
          class="h-7 flex-1 font-mono text-xs"
          @click.stop
          @keydown.enter.stop.prevent="linkEdit.save"
          @keydown.escape.stop.prevent="linkEdit.cancel"
          @keydown.space.stop
          @blur="linkEdit.save"
        />
        <span
          v-else
          class="min-w-0 flex-1 truncate font-mono text-xs text-text-strong"
        >
          {{ url }}
        </span>
        <div v-if="editingLinkIndex !== i" class="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            class="size-7 text-subline opacity-0 transition-opacity hover:text-headline group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
            :aria-label="`Edit ${url}`"
            @click.stop="startEditLink(i, url)"
          >
            <Pencil class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 text-subline opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
            :aria-label="`Delete ${url}`"
            @click.stop="ctx.removeSubmissionUrl(task, i)"
          >
            <X class="size-3.5" />
          </Button>
        </div>
      </div>
      <p v-if="links.length === 0" class="px-2 py-4 text-center text-xs text-subline">
        No submission links yet — paste the first one below.
      </p>
      </div>
      <div class="flex shrink-0 items-center gap-2 px-2 pb-1 pt-2">
        <Input
          v-model="newLink"
          type="url"
          class="h-8 font-mono text-xs"
          placeholder="Paste a link and press Enter..."
          @keydown.enter.prevent="handleAddLink"
        />
        <Button size="icon" class="size-8 shrink-0" aria-label="Add submission link" @click="handleAddLink">
          <Plus class="size-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
