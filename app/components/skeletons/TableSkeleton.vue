<script setup lang="ts">
  import { Skeleton } from '@/components/ui/skeleton'

  const props = withDefaults(defineProps<{
    /** Row count on desktop. Mobile shows the first four. */
    rows?: number
    /** One class string per column; include height, width, and responsive hiding. */
    barClass: string[]
    /** Render a header row above the body rows. */
    withHeader?: boolean
  }>(), {
    rows: 6,
    withHeader: false,
  })
</script>

<template>
  <div aria-hidden="true" class="w-full overflow-hidden">
    <div
      v-if="props.withHeader"
      class="flex items-center gap-4 border-b border-line px-4 py-3 sm:px-6"
    >
      <Skeleton
        v-for="(entry, index) in props.barClass"
        :key="`header-${index}`"
        :class="entry"
      />
    </div>

    <div
      v-for="row in props.rows"
      :key="row"
      :class="[
        'items-center gap-4 border-b border-line px-4 py-3.5 last:border-0 sm:px-6 sm:py-4',
        row > 4 ? 'hidden sm:flex' : 'flex',
      ]"
    >
      <Skeleton
        v-for="(entry, index) in props.barClass"
        :key="`row-${row}-${index}`"
        :class="entry"
      />
    </div>
  </div>
</template>
