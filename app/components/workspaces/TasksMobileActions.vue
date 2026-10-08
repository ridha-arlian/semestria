<script setup lang="ts">
  import { MoreHorizontal, RefreshCcw, Trash2 } from '@lucide/vue'
  import type { Task } from '~/types'

  defineProps<{ task: Task }>()
  const emit = defineEmits<{
    'change-status': [task: Task]
    'delete': [task: Task]
  }>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="size-8 shrink-0 text-subline hover:text-ink"
        aria-label="Task actions"
      >
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('change-status', task)">
        <RefreshCcw class="mr-2 size-3.5 text-subline" /> Change status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="cursor-pointer text-xs text-destructive focus:text-destructive"
        @click="emit('delete', task)"
      >
        <Trash2 class="mr-2 size-3.5" /> Delete task
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
