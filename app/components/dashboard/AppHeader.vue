<script setup lang="ts">
  import { Plus, Search } from '@lucide/vue'
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { useSidebar } from '@/components/ui/sidebar'
  import AppIcon from '~/components/icons/AppIcon.vue'
  import type { View } from '~/types/dashboard'

  const props = defineProps<{
    view: View
  }>()

  const emit = defineEmits<{
    'add': []
  }>()

  const { toggleSidebar } = useSidebar()

  const heading = computed(() => (props.view === 'Overview' ? 'Good morning, Ari.' : props.view))
</script>

<template>
  <header class="sticky top-0 z-10 flex h-19 items-center justify-between border-b border-neutral-200 bg-paper/95 px-5 backdrop-blur md:px-9">
    <div class="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        class="size-8 md:hidden"
        aria-label="Toggle sidebar"
        @click="toggleSidebar"
      >
        <AppIcon class="size-8" />
      </Button>

      <div>
        <p class="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
          Tuesday, September 10, 2026
        </p>
        <h1 class="mt-1 text-xl font-semibold tracking-[-0.03em]">
          {{ heading }}
        </h1>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" class="hidden h-9 items-center gap-2 text-xs text-neutral-500 sm:flex">
        <Search class="size-3.5" />
        Search
        <span class="ml-3 font-mono text-[10px] text-neutral-300">
          ⌘ K
        </span>
      </Button>

      <Button variant="outline" size="icon" class="size-9" @click="emit('add')">
        <Plus class="size-4" />
      </Button>
    </div>
  </header>
</template>
