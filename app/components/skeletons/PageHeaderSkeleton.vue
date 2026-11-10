<script setup lang="ts">
  import { Skeleton } from '@/components/ui/skeleton'

  const props = withDefaults(defineProps<{
    withAction?: boolean
  }>(), {
    withAction: false,
  })
</script>

<template>
  <div aria-hidden="true" class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <Skeleton class="h-5 w-32 sm:h-7 sm:w-48" />
    <Skeleton v-if="props.withAction" class="h-9 w-full rounded-md sm:w-28" />
  </div>
</template>
