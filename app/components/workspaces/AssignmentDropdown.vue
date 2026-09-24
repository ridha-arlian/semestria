<script setup lang="ts">
  import { MoreHorizontal, RefreshCcw, Share2 } from '@lucide/vue'
  import type { Assignment } from '~/types/dashboard'

  defineProps<{ assignment: Assignment }>()
  const emit = defineEmits<{
    'change-status': [assignment: Assignment]
    share: [assignment: Assignment]
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
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('change-status', assignment)">
        <RefreshCcw class="mr-2 size-3.5 text-subline" /> Ubah status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="cursor-pointer text-xs" @click="emit('share', assignment)">
        <Share2 class="mr-2 size-3.5 text-subline" /> Bagikan tautan
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>