<script setup lang="ts">
import { Check, Filter, Plus, Search, Sparkles, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { Assignment, Priority, Status } from '~/types/dashboard'

const props = defineProps<{
  assignments: Assignment[]
}>()

const emit = defineEmits<{
  'add': []
  'toggle-status': [item: Assignment]
  'remove': [id: number]
}>()

const search = ref('')
const statusFilter = ref<'All' | Status>('All')

const filtered = computed(() =>
  props.assignments.filter(a =>
    [a.task, a.course, a.status, a.priority].join(' ').toLowerCase().includes(search.value.toLowerCase())
    && (statusFilter.value === 'All' || a.status === statusFilter.value),
  ),
)

function statusClass(status: Status) {
  return status === 'Done'
    ? 'bg-neutral-900 text-white'
    : status === 'In progress'
      ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
      : 'bg-white text-neutral-500 border border-neutral-200'
}

function priorityClass(priority: Priority) {
  return priority === 'High'
    ? 'text-neutral-900 font-semibold'
    : priority === 'Medium'
      ? 'text-neutral-500'
      : 'text-neutral-400'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <p class="text-sm text-neutral-500">
        Keep every deadline in sight, without the spreadsheet stiffness.
      </p>
      <button class="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white" @click="emit('add')">
        <Plus class="size-3.5" />
        Add assignment
      </button>
    </div>

    <div class="flex flex-col gap-3 border-y border-neutral-200 py-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          class="w-full rounded-md border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900"
          placeholder="Search assignments..."
        >
      </div>
      <div class="flex items-center gap-2">
        <Filter class="size-3.5 text-neutral-400" />
        <select v-model="statusFilter" class="rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-xs outline-none">
          <option>All</option>
          <option>In progress</option>
          <option>Not started</option>
          <option>Done</option>
        </select>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table class="w-full min-w-190 text-left">
        <thead class="border-b border-neutral-200 bg-neutral-50">
          <tr class="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            <th class="px-5 py-3">Task</th>
            <th class="px-4 py-3">Course</th>
            <th class="px-4 py-3">Due date</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Progress</th>
            <th class="w-12 px-2" />
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr v-for="item in filtered" :key="item.id" class="group transition hover:bg-neutral-50">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <button
                  class="grid size-5 place-items-center rounded border border-neutral-300 transition hover:border-neutral-900"
                  :class="item.status === 'Done' ? 'bg-neutral-900 text-white' : ''"
                  @click="emit('toggle-status', item)"
                >
                  <Check v-if="item.status === 'Done'" class="size-3" />
                </button>
                <div>
                  <p class="text-xs font-semibold" :class="item.status === 'Done' ? 'text-neutral-400 line-through' : ''">
                    {{ item.task }}
                  </p>
                  <p class="mt-1 text-[10px]" :class="priorityClass(item.priority)">
                    {{ item.priority }} priority
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-4 text-xs text-neutral-500">
              {{ item.course }}
            </td>
            <td class="px-4 py-4 text-xs text-neutral-600">
              {{ item.due }}
            </td>
            <td class="px-4 py-4">
              <span class="rounded px-2 py-1 text-[10px] font-medium" :class="statusClass(item.status)">
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                  <div class="h-full rounded-full bg-neutral-900" :style="{ width: item.progress + '%' }" />
                </div>
                <span class="font-mono text-[10px] text-neutral-400">
                  {{ item.progress }}%
                </span>
              </div>
            </td>
            <td class="px-2 py-4">
              <button class="text-neutral-300 opacity-0 transition hover:text-neutral-900 group-hover:opacity-100" @click="emit('remove', item.id)">
                <Trash2 class="size-3.5" />
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="px-5 py-16 text-center">
              <Sparkles class="mx-auto size-5 text-neutral-300" />
              <p class="mt-3 text-sm font-medium">
                Nothing found
              </p>
              <p class="mt-1 text-xs text-neutral-400">
                Try a different search or add something new.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>