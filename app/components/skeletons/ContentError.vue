<script setup lang="ts">
  import { RefreshCcw } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import {
    Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle,
  } from '@/components/ui/empty'

  const props = withDefaults(defineProps<{
    message: string
    retryLabel?: string
  }>(), {
    retryLabel: 'Try again',
  })

  const emit = defineEmits<{
    retry: []
  }>()
</script>

<template>
  <Empty class="px-5 py-16 md:py-16">
    <EmptyHeader class="gap-1">
      <EmptyTitle class="text-sm font-medium">
        Couldn't load this page
      </EmptyTitle>
      <EmptyDescription class="text-xs">
        {{ props.message }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="outline" size="sm" @click="emit('retry')">
        <RefreshCcw data-icon="inline-start" />
        {{ props.retryLabel }}
      </Button>
    </EmptyContent>
  </Empty>
</template>
