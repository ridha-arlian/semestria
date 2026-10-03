<script setup lang="ts">
  import { MoreHorizontal, RefreshCcw, Share2 } from '@lucide/vue'
  import type { Task } from '~/types/dashboard'

  defineProps<{ task: Task }>()
  const emit = defineEmits<{
    'change-status': [task: Task]
    share: [task: Task]
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
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('change-status', task)">
        <RefreshCcw class="mr-2 size-3.5 text-subline" /> Change status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('share', task)">
        <Share2 class="mr-2 size-3.5 text-subline" /> Share link
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>