<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { computed } from 'vue'
import type { Assignment } from '~/types/dashboard'

const props = defineProps<{
  assignments: Assignment[]
}>()

const emit = defineEmits<{
  'view-all': []
}>()

const preview = computed(() => props.assignments.slice(0, 4))

function initials(course: string) {
  return course.split(' ').map(w => w[0]).join('').slice(0, 2)
}
</script>

<template>
  <section class="rounded-lg border border-neutral-200 bg-white">
    <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
      <div>
        <h2 class="text-sm font-semibold">
          Upcoming assignments
        </h2>
        <p class="mt-0.5 text-xs text-neutral-400">
          Your next deadlines at a glance.
        </p>
      </div>
      <button class="text-xs font-medium text-neutral-500 hover:text-neutral-900" @click="emit('view-all')">
        View all
        <ArrowUpRight class="ml-1 inline size-3" />
      </button>
    </div>
    <div class="divide-y divide-neutral-100">
      <button
        v-for="item in preview"
        :key="item.id"
        class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-neutral-50"
        @click="emit('view-all')"
      >
        <div class="grid size-8 shrink-0 place-items-center rounded bg-neutral-100 text-[10px] font-bold text-neutral-500">
          {{ initials(item.course) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold">
            {{ item.task }}
          </p>
          <p class="mt-1 text-[11px] text-neutral-400">
            {{ item.course }}
          </p>
        </div>
        <div class="hidden text-right sm:block">
          <p class="text-[11px] font-medium">
            {{ item.due }}
          </p>
          <p class="mt-1 text-[10px] text-neutral-400">
            {{ item.status }}
          </p>
        </div>
        <span class="size-1.5 rounded-full" :class="item.priority === 'High' ? 'bg-neutral-900' : 'bg-neutral-300'" />
      </button>
    </div>
  </section>
</template>