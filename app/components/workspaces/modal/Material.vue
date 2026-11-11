<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core'
  import type { MaterialPayload } from '~/types'
  import MaterialForm from './MaterialForm.vue'

  defineProps<{
    open: boolean
    courses?: string[]
    tasks?: { id: number, task: string, course: string }[]
  }>()

  const emit = defineEmits<{
    close: []
    submit: [payload: MaterialPayload, addAnother: boolean]
  }>()

  const isDesktop = useMediaQuery('(min-width: 768px)')

  function onOpenChange(value: boolean) {
    if (!value)
      emit('close')
  }
</script>

<template>
  <Dialog v-if="isDesktop" :open="open" @update:open="onOpenChange">
    <DialogContent class="flex max-h-[90vh] max-w-md flex-col" @open-auto-focus.prevent>
      <DialogHeader>
        <DialogTitle class="text-base">
          New material
        </DialogTitle>
        <DialogDescription class="sr-only">
          Add this material to your active workspace library.
        </DialogDescription>
      </DialogHeader>

      <div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-1">
        <MaterialForm
          :courses="courses"
          :tasks="tasks"
          autofocus
          @cancel="emit('close')"
          @submit="(payload, addAnother) => emit('submit', payload, addAnother)"
        />
      </div>
    </DialogContent>
  </Dialog>

  <Drawer v-else :open="open" @update:open="onOpenChange">
    <DrawerContent @open-auto-focus.prevent>
      <DrawerHeader class="text-left">
        <DrawerTitle class="text-base">
          New material
        </DrawerTitle>
        <DrawerDescription class="sr-only">
          Add this material to your active workspace library.
        </DrawerDescription>
      </DrawerHeader>

      <div class="max-h-[75vh] overflow-y-auto px-4 pb-6">
        <MaterialForm
          :courses="courses"
          :tasks="tasks"
          @cancel="emit('close')"
          @submit="(payload, addAnother) => emit('submit', payload, addAnother)"
        />
      </div>
    </DrawerContent>
  </Drawer>
</template>