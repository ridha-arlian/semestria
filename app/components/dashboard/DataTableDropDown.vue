<script setup lang="ts">
  import { MoreHorizontal, Pencil, Trash2 } from '@lucide/vue'
  import type { Workspace } from '~/types'

  interface MenuBarrier {
    registerMenuOpen: (open: boolean) => void
    shouldSwallowActivation: () => boolean
  }

  defineProps<{ workspace: Workspace }>()
  const emit = defineEmits<{
    edit: [workspace: Workspace]
    delete: [workspace: Workspace]
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
        class="size-8 text-subline opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 hover:text-ink"
      >
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('edit', workspace)">
        <Pencil class="mr-2 size-3.5 text-subline" /> Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="cursor-pointer text-xs text-destructive focus:text-destructive" @click="emit('delete', workspace)">
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