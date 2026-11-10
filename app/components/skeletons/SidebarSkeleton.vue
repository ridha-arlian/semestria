<script setup lang="ts">
  import { Skeleton } from '@/components/ui/skeleton'

  const props = withDefaults(defineProps<{
    lines?: number
  }>(), {
    lines: 4,
  })
</script>

<template>
  <div aria-hidden="true" class="flex flex-col gap-1">
    <div
      v-for="line in props.lines"
      :key="line"
      class="flex items-center gap-2 px-2 py-1.5"
    >
      <Skeleton class="size-5 shrink-0 rounded" />
      <Skeleton class="h-3 flex-1" />
    </div>
  </div>
</template>
