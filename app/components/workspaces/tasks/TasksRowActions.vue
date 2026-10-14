<script setup lang="ts">
import { MoreHorizontal, RefreshCcw, Trash2 } from '@lucide/vue'
import type { Task } from '~/types'

interface MenuBarrier {
  registerMenuOpen: (open: boolean) => void
  shouldSwallowActivation: () => boolean
}

defineProps<{ task: Task }>()
const emit = defineEmits<{
  'change-status': [task: Task]
  'delete': [task: Task]
}>()

const barrier = inject<MenuBarrier | null>('dataTableMenuBarrier', null)
const menuOpen = ref(false)

function onUpdateOpen(open: boolean) {
  // A click that just dismissed another menu must only close, never open.
  if (open && barrier?.shouldSwallowActivation())
    return
  if (menuOpen.value !== open) {
    menuOpen.value = open
    barrier?.registerMenuOpen(open)
  }
}
</script>

<template>
  <DropdownMenu :open="menuOpen" @update:open="onUpdateOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="size-8 text-subline opacity-100 transition-opacity hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Task actions"
      >
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuItem v-if="!(task.checklist?.length)" class="cursor-pointer text-xs" @click="emit('change-status', task)">
        <RefreshCcw class="mr-2 size-3.5 text-subline" /> Change status
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="!(task.checklist?.length)" />
      <DropdownMenuItem
        class="cursor-pointer text-xs text-destructive focus:text-destructive"
        @click="emit('delete', task)"
      >
        <Trash2 class="mr-2 size-3.5" /> Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <Teleport to="body">
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-40 cursor-default"
      aria-hidden="true"
    />
  </Teleport>
</template>
