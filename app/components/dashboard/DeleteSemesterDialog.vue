<script setup lang="ts">
  import { TriangleAlert } from '@lucide/vue'
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
  import { Button } from '~/components/ui/button'
  import type { Workspace } from '@/components/ui/data-table/columns'

  const props = defineProps<{
    workspace?: Workspace | null
  }>()

  const isOpen = defineModel<boolean>('open', { default: false })

  const emit = defineEmits<{
    (e: 'confirm', workspace: Workspace): void
    (e: 'close'): void
  }>()

  function handleConfirm() {
    if (props.workspace) {
      emit('confirm', props.workspace)
    }
    isOpen.value = false
  }

  function handleOpenChange(val: boolean) {
    isOpen.value = val
    if (!val) emit('close')
  }
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-106.25">
      <DialogHeader class="items-center text-center">
        <div class="mx-auto mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert class="size-5 text-destructive" />
        </div>
        <DialogTitle>
          Delete workspace
        </DialogTitle>
        <DialogDescription class="pt-1 text-xs text-subline">
          Are you sure you want to delete <strong class="font-semibold text-destructive">{{ workspace?.name }}</strong>? This action cannot be undone and will delete all associated courses and assignments.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter class="pt-3 sm:justify-center">
        <Button type="button" variant="outline" @click="isOpen = false">
          Cancel
        </Button>
        <Button type="button" variant="destructive" class="transition-[filter] hover:brightness-90 active:brightness-75" @click="handleConfirm">
          Delete workspace
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>