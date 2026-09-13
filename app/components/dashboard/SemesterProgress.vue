<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  completed: number
  total: number
}>()

const emit = defineEmits<{
  'add-material': []
}>()

const percent = computed(() => (props.total ? (props.completed / props.total) * 100 : 0))
</script>

<template>
  <section class="rounded-lg border border-neutral-200 bg-white">
    <div class="border-b border-neutral-200 px-5 py-4">
      <h2 class="text-sm font-semibold">
        Semester progress
      </h2>
      <p class="mt-0.5 text-xs text-neutral-400">
        A quiet check-in with your goals.
      </p>
    </div>
    <div class="space-y-6 p-5">
      <div>
        <div class="flex justify-between text-xs">
          <span>
            Assignments completed
          </span>
          <span class="font-mono text-neutral-500">
            {{ completed }}/{{ total }}
          </span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div class="h-full rounded-full bg-neutral-900 transition-all" :style="{ width: percent + '%' }" />
        </div>
      </div>
      <div class="border-t border-neutral-100 pt-5">
        <p class="text-[11px] uppercase tracking-[0.15em] text-neutral-400">
          Focus for this week
        </p>
        <p class="mt-2 text-sm leading-relaxed">
          Finish the research proposal and review your notes from week two.
        </p>
        <button class="mt-4 flex items-center gap-2 text-xs font-semibold underline underline-offset-4" @click="emit('add-material')">
          Add a study note
          <Plus class="size-3" />
        </button>
      </div>
    </div>
  </section>
</template>