<script setup lang="ts">
import * as imageCropper from '@zag-js/image-cropper'
import { normalizeProps, useMachine } from '@zag-js/vue'
import { RotateCcw } from '@lucide/vue'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{
  open: boolean
  src: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [blob: Blob]
}>()

const { showToast } = useSettings()

const openState = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const service = useMachine(imageCropper.machine, {
  id: 'avatar-crop',
  cropShape: 'circle',
  aspectRatio: 1,
  // Avatars crop with a fixed circle: the user pans and zooms the image
  // underneath instead of resizing a selection with eight handles.
  fixedCropArea: true,
  minZoom: 1,
  maxZoom: 4,
  defaultZoom: 1,
})

const api = computed(() => imageCropper.connect(service, normalizeProps))

const zoom = computed(() => Math.round(api.value.zoom * 100) / 100)
const zoomPercent = computed(() => `${Math.round(api.value.zoom * 100)}%`)
const imageReady = ref(false)
const saving = ref(false)

// Every open starts from the untouched image so a discarded crop never leaks
// into the next attempt.
watch(() => props.open, (open) => {
  if (!open)
    return
  imageReady.value = false
  saving.value = false
  nextTick(() => api.value.reset())
})

function handleZoomInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (Number.isFinite(value))
    api.value.setZoom(value)
}

const ZOOM_STEP = 0.1

// The machine's own wheel effect does not attach in this version, so drive
// wheel zoom here. Values are clamped to the same 1x-4x range as the slider.
function handleWheel(event: WheelEvent) {
  const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
  const next = Math.min(4, Math.max(1, api.value.zoom + delta))
  if (next !== api.value.zoom)
    api.value.setZoom(next)
}

async function handleSave() {
  if (saving.value)
    return
  saving.value = true
  try {
    const blob = await api.value.getCroppedImage({
      type: 'image/webp',
      quality: 0.9,
      maxSize: { width: 512, height: 512 },
    })
    if (blob instanceof Blob) {
      emit('save', blob)
      openState.value = false
    }
    else {
      showToast('Could not crop this image')
    }
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="openState">
    <DialogContent class="z-[70]! gap-0 p-0 sm:max-w-md">
      <div class="flex flex-col gap-4 p-5">
        <div class="flex flex-col gap-1">
          <DialogTitle class="text-base font-semibold text-headline">
            Crop avatar
          </DialogTitle>
          <DialogDescription class="text-[12px] text-subline">
            Drag the image to reposition it, then scroll or use the slider to zoom.
          </DialogDescription>
        </div>

        <div v-bind="api.getRootProps()" class="flex flex-col gap-4">
          <div
            v-bind="api.getViewportProps()"
            class="relative mx-auto size-72 cursor-grab touch-none overflow-hidden rounded-lg bg-soft active:cursor-grabbing"
            @wheel.prevent="handleWheel"
          >
            <img
              v-if="src"
              :src="src"
              alt=""
              draggable="false"
              v-bind="api.getImageProps()"
              class="select-none"
              @load="imageReady = true"
            >
            <div
              v-bind="api.getSelectionProps()"
              class="pointer-events-none rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ring-1 ring-paper/80"
            />
          </div>

          <div class="flex items-center gap-3">
            <Label for="avatar-crop-zoom" class="text-xs text-subline">Zoom</Label>
            <input
              id="avatar-crop-zoom"
              type="range"
              min="1"
              max="4"
              step="0.01"
              :value="zoom"
              class="h-1 w-full cursor-pointer accent-ink"
              @input="handleZoomInput"
            >
            <span class="w-10 text-right font-mono text-[11px] tabular-nums text-subline">
              {{ zoomPercent }}
            </span>
          </div>
        </div>

        <Separator />

        <div class="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" @click="api.reset()">
            <RotateCcw />
            Reset
          </Button>
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="openState = false">
              Cancel
            </Button>
            <Button size="sm" :disabled="!imageReady || saving" @click="handleSave">
              Save
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
