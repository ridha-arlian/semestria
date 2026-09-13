<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { computed } from 'vue'
import type { Assignment } from '~/types/dashboard'

const props = defineProps<{
  assignments: Assignment[]
  completed: number
}>()

const stats = computed(() => [
  {
    label: 'Active assignments',
    value: String(props.assignments.filter(a => a.status !== 'Done').length),
    note: '2 due this week',
  },
  {
    label: 'Completed',
    value: String(props.completed),
    note: `of ${props.assignments.length} assignments`,
  },
  {
    label: 'Study progress',
    value: '42%',
    note: 'Keep the rhythm going',
  },
  {
    label: 'Next deadline',
    value: '2 days',
    note: 'Research proposal',
  },
])
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="(stat, i) in stats"
      :key="stat.label"
      class="rounded-lg border border-neutral-200 bg-white p-5"
      :class="'delay-' + (i + 1)"
    >
      <div class="flex items-start justify-between">
        <span class="text-xs text-neutral-500">
          {{ stat.label }}
        </span>
        <ArrowUpRight v-if="i < 2" class="size-3.5 text-neutral-300" />
      </div>
      <p class="mt-4 text-3xl font-semibold tracking-tighter">
        {{ stat.value }}
      </p>
      <p class="mt-1 text-[11px] text-neutral-400">
        {{ stat.note }}
      </p>
    </div>
  </div>
</template>