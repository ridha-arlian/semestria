<script setup lang="ts">
  // Landing-only static copy of the dashboard table. Kept separate so the
  // dashboard page and its table behaviour stay untouched.
  import { computed } from 'vue'
  import { Circle, Plus } from '@lucide/vue'
  import DataTable from '@/components/ui/data-table/DataTable.vue'
  import { columns } from '~/components/landing/workspaceColumns'

  const api = useApi()
  const workspaces = computed(() => api.getWorkspaces())
</script>

<template>
  <div class="w-256 border border-line bg-card shadow-[10px_10px_0_var(--line-strong)] md:rotate-[1.2deg] md:shadow-[22px_22px_0_var(--line-strong)]">
    <div class="flex items-center gap-1.5 border-b border-line px-4 py-3.5 font-mono text-[10px]">
      <Circle class="h-2 w-2 text-subline" />
      <Circle class="h-2 w-2 text-subline" />
      <Circle class="h-2 w-2 text-subline" />

      <strong class="ml-3.5 font-sans text-[13px] font-bold text-headline">
        My semester
      </strong>
      <span class="ml-auto text-subline">
        Fall 2026
      </span>
    </div>

    <DataTable
      class="[&_tbody_tr]:cursor-default"
      :columns="columns"
      :data="workspaces"
      :mobile-hidden-columns="['progress', 'assignments']"
      :column-class="{
        progress: 'w-56 shrink-0',
        assignments: 'w-64 shrink-0',
      }"
    >
      <template #empty>
        <div class="px-5 py-16 text-center">
          <p class="text-sm font-medium text-text-strong">
            No workspaces yet
          </p>
          <p class="mt-1 text-xs text-subline">
            Create your first workspace to start organizing your semester.
          </p>
        </div>
      </template>
    </DataTable>

    <div class="flex items-center gap-2 border-t border-line bg-soft px-5 py-4 font-mono text-[10px] text-text-muted">
      <Plus class="h-3.5 w-3.5" />
      Add an assignment
    </div>
  </div>
</template>
