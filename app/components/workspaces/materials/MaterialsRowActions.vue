<script setup lang="ts">
import { ArrowUpRight, Check, MoreHorizontal, Trash2 } from '@lucide/vue'
import type { Material } from '~/types'

interface MenuBarrier {
  registerMenuOpen: (open: boolean) => void
  shouldSwallowActivation: () => boolean
}

defineProps<{ material: Material }>()
const emit = defineEmits<{
  'open-link': [material: Material]
  'mark-reviewed': [material: Material]
  'delete': [material: Material]
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
        aria-label="Material actions"
      >
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuItem
        v-if="material.url || material.links?.length"
        class="cursor-pointer text-xs"
        @click="emit('open-link', material)"
      >
        <ArrowUpRight class="mr-2 size-3.5 text-subline" /> Open content
      </DropdownMenuItem>
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('mark-reviewed', material)">
        <Check class="mr-2 size-3.5 text-subline" /> Mark reviewed
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="cursor-pointer text-xs text-destructive focus:text-destructive"
        @click="emit('delete', material)"
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
