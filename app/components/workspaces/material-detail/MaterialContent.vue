<script setup lang="ts">
import { ArrowUpRight, Check, CloudUpload, FileText, RefreshCw, X } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

// --- Google Drive connection (mocked locally until a real integration exists) ---
const driveConnected = ref(true)

function connectDrive() {
  driveConnected.value = true
}

// --- File upload state (all in-memory) ---
const MAX_MB = 20
const ALLOWED_EXT = ['pdf', 'pptx', 'ppt']

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const progress = ref<number | null>(null)
const uploadError = ref<string | null>(null)
const uploadedSize = ref<string | null>(null)
const uploadedObjectUrl = ref<string | null>(null)
let pendingFile: File | null = null
let progressTimer: ReturnType<typeof setInterval> | undefined

const hasFile = computed(() => !!props.material.url)

const fileName = computed(() => {
  if (pendingFile)
    return pendingFile.name
  const url = props.material.url ?? ''
  try {
    const parsed = new URL(url)
    const last = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '')
    if (last)
      return last
  }
  catch {
    // fall through to title
  }
  return props.material.title
})

function openFile() {
  const target = uploadedObjectUrl.value ?? props.material.url
  if (target)
    window.open(target, '_blank', 'noopener,noreferrer')
}

function pickFile() {
  uploadError.value = null
  fileInput.value?.click()
}

function formatSize(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function startUpload(file: File) {
  pendingFile = file
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.includes(ext)) {
    uploadError.value = `“${file.name}” isn't supported. Please choose a PDF or PPTX file.`
    progress.value = null
    return
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    uploadError.value = `“${file.name}” is larger than ${MAX_MB} MB.`
    progress.value = null
    return
  }
  uploadError.value = null
  progress.value = 0
  uploadedSize.value = formatSize(file.size)
  if (progressTimer)
    clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (progress.value === null)
      return
    progress.value = Math.min(100, progress.value + Math.ceil(Math.random() * 18))
    if (progress.value >= 100) {
      if (progressTimer)
        clearInterval(progressTimer)
      progressTimer = undefined
      finishUpload(file)
    }
  }, 160)
}

function finishUpload(file: File) {
  progress.value = null
  if (uploadedObjectUrl.value)
    URL.revokeObjectURL(uploadedObjectUrl.value)
  uploadedObjectUrl.value = URL.createObjectURL(file)
  // Mock Drive URL until a real integration exists.
  ctx.updateMaterialUrl(props.material.id, uploadedObjectUrl.value)
  pendingFile = null
}

function cancelUpload() {
  if (progressTimer)
    clearInterval(progressTimer)
  progressTimer = undefined
  progress.value = null
}

function retryUpload() {
  if (pendingFile)
    startUpload(pendingFile)
}

function onInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file)
    startUpload(file)
  if (fileInput.value)
    fileInput.value.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file)
    startUpload(file)
}

onUnmounted(() => {
  if (progressTimer)
    clearInterval(progressTimer)
  if (uploadedObjectUrl.value)
    URL.revokeObjectURL(uploadedObjectUrl.value)
})

// --- Notes (autosave with "Saved" indicator) ---
const noteDraft = ref('')
const noteJustSaved = ref(false)
let noteSavedTimer: ReturnType<typeof setTimeout> | undefined
let noteDebounce: ReturnType<typeof setTimeout> | undefined
const noteDirty = computed(() => noteDraft.value !== (props.material.description ?? ''))

watch(() => props.material.id, () => {
  noteDraft.value = props.material.description ?? ''
}, { immediate: true })

watch(() => props.material.description, (value) => {
  // Ignore echoes of our own saves.
  if (!noteDirty.value)
    noteDraft.value = value ?? ''
})

function persistNote() {
  if (!noteDirty.value)
    return
  ctx.updateMaterialNote(props.material.id, noteDraft.value)
  noteJustSaved.value = true
  if (noteSavedTimer)
    clearTimeout(noteSavedTimer)
  noteSavedTimer = setTimeout(() => {
    noteJustSaved.value = false
  }, 2000)
}

watch(noteDraft, () => {
  if (noteDebounce)
    clearTimeout(noteDebounce)
  noteDebounce = setTimeout(persistNote, 800)
})

function revertNote() {
  noteDraft.value = props.material.description ?? ''
}

onUnmounted(() => {
  if (noteSavedTimer)
    clearTimeout(noteSavedTimer)
  if (noteDebounce)
    clearTimeout(noteDebounce)
  persistNote()
})
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Content
      </CardTitle>
      <CardDescription class="mt-0.5 text-xs text-subline">
        File and notes for this material.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-5 p-4 sm:p-5">
      <!-- Drive not connected -->
      <div v-if="!driveConnected" class="rounded-lg border border-line bg-soft/50 px-4 py-6 text-center">
        <CloudUpload class="mx-auto size-5 text-subline" />
        <p class="mt-2 text-sm font-medium text-text-strong">
          Connect Google Drive to upload
        </p>
        <p class="mt-1 text-xs text-subline">
          Link your Drive account to attach files to this material.
        </p>
        <Button size="sm" class="mt-3" @click="connectDrive">
          Connect Google Drive
        </Button>
      </div>

      <template v-else>
        <!-- Uploading -->
        <div v-if="progress !== null" class="space-y-2">
          <div class="flex items-center justify-between gap-2 text-xs">
            <p class="min-w-0 truncate font-medium text-text-strong">
              Uploading {{ fileName }}…
            </p>
            <span class="shrink-0 font-mono text-subline">{{ progress }}%</span>
          </div>
          <Progress :model-value="progress" class="h-1.5" />
          <div>
            <Button size="sm" variant="outline" @click="cancelUpload">
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
            <Button size="sm" variant="outline" @click="retryUpload">
              <RefreshCw class="mr-1.5 size-3.5" />
              Retry
            </Button>
            <Button size="sm" variant="ghost" @click="uploadError = null">
              Dismiss
            </Button>
          </div>
        </div>

        <!-- With file -->
        <div v-else-if="hasFile" class="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-3">
          <div class="grid size-10 shrink-0 place-items-center rounded bg-soft text-subline">
            <FileText class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-text-strong">
              {{ fileName }}
            </p>
            <p class="mt-0.5 truncate text-xs text-subline">
              {{ uploadedSize ?? 'Drive file' }} · Uploaded {{ material.reviewed }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <Button size="sm" variant="outline" @click="openFile">
              Open in Drive
              <ArrowUpRight class="ml-1 size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" @click="pickFile">
              Replace
            </Button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else>
          <button
            type="button"
            class="flex w-full flex-col items-center rounded-lg border border-dashed border-line px-4 py-8 text-center transition-colors hover:border-ink/30 hover:bg-soft/50"
            :class="isDragging && 'border-ink/40 bg-soft/60'"
            @click="pickFile"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @keydown.enter.prevent="pickFile"
            @keydown.space.prevent="pickFile"
          >
            <CloudUpload class="size-5 text-subline" />
            <p class="mt-2 text-sm font-medium text-text-strong">
              Drag a file here or <span class="underline underline-offset-2">Choose file</span>
            </p>
            <p class="mt-1 text-xs text-subline">
              PDF, PPTX · max 20 MB
            </p>
          </button>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.pptx,.ppt"
          class="sr-only"
          tabindex="-1"
          @change="onInputChange"
        >
      </template>

      <Separator />

      <!-- Notes -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="material-notes" class="text-xs font-medium">Notes</Label>
          <p v-if="noteJustSaved" class="flex items-center gap-1 text-[11px] text-text-muted">
            <Check class="size-3" />
            Saved
          </p>
        </div>
        <Textarea
          id="material-notes"
          v-model="noteDraft"
          rows="5"
          class="min-h-28 resize-y text-sm"
          placeholder="Write notes..."
          @keydown.escape.prevent="revertNote"
          @blur="persistNote"
        />
      </div>
    </CardContent>
  </Card>
</template>
