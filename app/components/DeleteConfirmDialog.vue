<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'

withDefaults(defineProps<{
  title: string
  confirmLabel?: string
}>(), {
  confirmLabel: 'Delete',
})

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  confirm: []
  close: []
}>()

function handleConfirm() {
  emit('confirm')
  open.value = false
}

function handleOpenChange(val: boolean) {
  open.value = val
  if (!val)
    emit('close')
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-106.25" @open-auto-focus.prevent>
      <DialogHeader class="items-center text-center">
        <div class="mx-auto mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert class="size-5 text-destructive" />
        </div>
        <DialogTitle>
          {{ title }}
        </DialogTitle>
        <DialogDescription class="pt-1 text-xs text-subline">
          <slot name="description" />
        </DialogDescription>
      </DialogHeader>

      <slot name="extra" />

      <DialogFooter class="pt-3 sm:justify-center">
        <Button type="button" variant="outline" @click="handleOpenChange(false)">
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          class="transition-[filter] hover:brightness-90 active:brightness-75"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
