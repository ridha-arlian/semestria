<script setup lang="ts">
import { ArrowUpRight, BookOpen, CloudUpload, FileText, Presentation, RefreshCw, Video, X } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'
import { BOOK_RULES, DOCUMENT_RULES, VIDEO_RULES, formatFileSize } from '~/utils/materialContent'
import { useMaterialFile } from '~/composables/useMaterialFile'

const props = defineProps<{
  material: Material
  type: 'PDF' | 'Slides' | 'Video' | 'Book'
}>()

const ctx = inject<MaterialDetailContext>('workspace')!
const materialRef = toRef(props, 'material')

const rules = computed(() => {
  if (props.type === 'Video')
    return VIDEO_RULES
  if (props.type === 'Book')
    return BOOK_RULES
  return DOCUMENT_RULES[props.type]
})
const icon = computed(() => {
  if (props.type === 'PDF')
    return FileText
  if (props.type === 'Slides')
    return Presentation
  if (props.type === 'Book')
    return BookOpen
  return Video
})
const emptyTitle = computed(() =>
  props.type === 'PDF'
    ? 'Drop a PDF here or'
    : props.type === 'Slides'
      ? 'Drop a deck here or'
      : props.type === 'Book'
        ? 'Drop an ebook here or'
        : 'Drop a video here or',
)
const emptyHint = computed(() =>
  props.type === 'PDF'
    ? 'PDF · max 20 MB'
    : props.type === 'Slides'
      ? 'PPT, PPTX, PDF, KEY · max 20 MB'
      : props.type === 'Book'
        ? 'PDF, EPUB · max 50 MB'
        : 'MP4, WEBM, MOV · max 200 MB',
)

const upload = useMaterialFile(materialRef, ctx, rules.value)
const { fileInput, isDragging, progress, uploadError, hasFile, fileName, fileSize, uploadingName, accept } = upload

const meta = computed(() => {
  const size = fileSize.value ? formatFileSize(fileSize.value) : 'Attached file'
  const label = props.type === 'PDF' ? 'PDF' : props.type === 'Slides' ? 'Slides' : props.type === 'Book' ? 'Ebook' : 'Video'
  return `${label} · ${size}`
})

const removeOpen = ref(false)
const replaceOpen = ref(false)
const pendingReplaceFile = ref<File | null>(null)

function onInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file)
    handleFile(file)
  if (fileInput.value)
    fileInput.value.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file)
    handleFile(file)
}

function handleFile(file: File) {
  if (!upload.checkFile(file))
    return
  if (hasFile.value) {
    pendingReplaceFile.value = file
    replaceOpen.value = true
    return
  }
  upload.startUpload(file)
}

function confirmReplace() {
  if (!pendingReplaceFile.value)
    return
  upload.startUpload(pendingReplaceFile.value)
  pendingReplaceFile.value = null
}

function removeFile() {
  ctx.setMaterialContent(props.material.id, null)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Uploading -->
    <div v-if="progress !== null" class="space-y-2">
      <div class="flex items-center justify-between gap-2 text-xs">
        <p class="min-w-0 truncate font-medium text-text-strong">
          Uploading {{ uploadingName }}…
        </p>
        <span class="shrink-0 font-mono text-subline">{{ progress }}%</span>
      </div>
      <Progress :model-value="progress" class="h-1.5" />
      <div>
        <Button size="sm" variant="outline" @click="upload.cancelUpload">
          <X class="mr-1.5 size-3.5" />
          Cancel
        </Button>
      </div>
    </div>

    <!-- Upload error -->
    <div v-else-if="uploadError" class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-5 text-center">
      <p class="text-sm font-medium text-text-strong">
        Upload failed
      </p>
      <p class="mt-1 text-xs text-subline">
        {{ uploadError }}
      </p>
      <div class="mt-3 flex justify-center gap-2">
        <Button size="sm" variant="outline" @click="upload.retryUpload">
          <RefreshCw class="mr-1.5 size-3.5" />
          Retry
        </Button>
        <Button size="sm" variant="ghost" @click="upload.clearError">
          Dismiss
        </Button>
      </div>
    </div>

    <!-- With file -->
    <div v-if="hasFile && progress === null" class="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-3">
      <div class="grid size-10 shrink-0 place-items-center rounded bg-soft text-subline">
        <component :is="icon" class="size-4" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-text-strong">
          {{ fileName }}
        </p>
        <p class="mt-0.5 truncate font-mono text-[11px] text-subline">
          {{ meta }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" @click="upload.openFile">
          Open
          <ArrowUpRight class="ml-1 size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" @click="upload.pickFile">
          Replace
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          class="text-subline hover:text-destructive"
          aria-label="Remove file"
          title="Remove file"
          @click="removeOpen = true"
        >
          <X class="size-3.5" />
        </Button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!hasFile && progress === null">
      <button
        type="button"
        class="flex w-full flex-col items-center rounded-lg border border-dashed border-line px-4 py-8 text-center transition-colors hover:border-ink/30 hover:bg-soft/50"
        :class="isDragging && 'border-ink/40 bg-soft/60'"
        @click="upload.pickFile"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @keydown.enter.prevent="upload.pickFile"
        @keydown.space.prevent="upload.pickFile"
      >
        <CloudUpload class="size-5 text-subline" />
        <p class="mt-2 text-sm font-medium text-text-strong">
          {{ emptyTitle }} <span class="underline underline-offset-2">Choose file</span>
        </p>
        <p class="mt-1 font-mono text-[11px] text-subline">
          {{ emptyHint }}
        </p>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="sr-only"
      tabindex="-1"
      @change="onInputChange"
    >

    <ConfirmDialog
      v-model:open="removeOpen"
      title="Remove this file?"
      confirm-label="Remove"
      @confirm="removeFile"
    >
      <template #description>
        The file will be detached from this material. You can upload it again later.
      </template>
    </ConfirmDialog>

    <ConfirmDialog
      v-model:open="replaceOpen"
      title="Replace this file?"
      confirm-label="Replace"
      @confirm="confirmReplace"
      @close="pendingReplaceFile = null"
    >
      <template #description>
        <template v-if="pendingReplaceFile">
          “{{ pendingReplaceFile.name }}” will replace the current file.
        </template>
        <template v-else>
          The current file will be replaced.
        </template>
      </template>
    </ConfirmDialog>
  </div>
</template>
