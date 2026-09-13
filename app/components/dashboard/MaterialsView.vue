<script setup lang="ts">
import { ArrowUpRight, FileText, Plus, Search, Sparkles } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { Material } from '~/types/dashboard'

const props = defineProps<{
  materials: Material[]
}>()

const emit = defineEmits<{
  add: []
}>()

const search = ref('')

const filtered = computed(() =>
  props.materials.filter(m =>
    [m.title, m.course, m.type, m.tags].join(' ').toLowerCase().includes(search.value.toLowerCase()),
  ),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <p class="text-sm text-neutral-500">
        A flexible shelf for everything worth coming back to.
      </p>
      <button class="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white" @click="emit('add')">
        <Plus class="size-3.5" />
        Add material
      </button>
    </div>

    <div class="flex flex-col gap-3 border-y border-neutral-200 py-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          class="w-full rounded-md border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900"
          placeholder="Search materials..."
        >
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table class="w-full min-w-190 text-left">
        <thead class="border-b border-neutral-200 bg-neutral-50">
          <tr class="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            <th class="px-5 py-3">Material</th>
            <th class="px-4 py-3">Course</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Tags</th>
            <th class="px-4 py-3">Last reviewed</th>
            <th class="w-12 px-2" />
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr v-for="item in filtered" :key="item.id" class="group transition hover:bg-neutral-50">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="grid size-8 place-items-center rounded bg-neutral-100">
                  <FileText class="size-3.5 text-neutral-500" />
                </div>
                <p class="text-xs font-semibold">
                  {{ item.title }}
                </p>
              </div>
            </td>
            <td class="px-4 py-4 text-xs text-neutral-500">
              {{ item.course }}
            </td>
            <td class="px-4 py-4 text-xs text-neutral-600">
              {{ item.type }}
            </td>
            <td class="px-4 py-4 text-xs text-neutral-500">
              {{ item.tags }}
            </td>
            <td class="px-4 py-4 text-xs text-neutral-500">
              {{ item.reviewed }}
            </td>
            <td class="px-2 py-4">
              <button class="text-neutral-400 hover:text-neutral-900">
                <ArrowUpRight class="size-3.5" />
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