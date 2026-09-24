<script setup lang="ts">
  import { MoreHorizontal, Pencil, Trash2 } from '@lucide/vue'
  import type { Workspace } from '~/components/dashboard/workspaceColumns.ts'

  defineProps<{ workspace: Workspace }>()
  const emit = defineEmits<{
    edit: [workspace: Workspace]
    delete: [workspace: Workspace]
  }>()
</script>

<template>
  <DropdownMenu>
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
</template>