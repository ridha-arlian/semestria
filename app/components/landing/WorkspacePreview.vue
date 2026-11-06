<script setup lang="ts">
  // Landing-only static copy of the dashboard table. Kept separate so the
  // dashboard page and its table behaviour stay untouched.
  import { Circle, Plus } from '@lucide/vue'
  import DataTable from '@/components/ui/data-table/DataTable.vue'
  import { columns } from '~/components/landing/workspaceColumns'
  import type { Workspace } from '~/types'

  // Fixed preview data: the landing page must never read the signed-in user's
  // workspaces, and the real list is not fetched on `/`.
  const workspaces: Workspace[] = [
    {
      id: 1,
      name: 'Fall 2026',
      slug: 'fall-2026',
      dates: 'Sep 1 – Dec 20, 2026',
      courses: 5,
      assignments: 24,
      completed: 15,
      progress: 63,
      active: true,
      next: 'Problem Set 6',
      nextDue: 'Nov 8',
    },
    {
      id: 2,
      name: 'Spring 2026',
      slug: 'spring-2026',
      dates: 'Feb 2 – May 29, 2026',
      courses: 4,
      assignments: 18,
      completed: 18,
      progress: 100,
      active: false,
      next: 'Semester complete',
      nextDue: '—',
    },
    {
      id: 3,
      name: 'Fall 2025',
      slug: 'fall-2025',
      dates: 'Sep 1 – Dec 19, 2025',
      courses: 6,
      assignments: 30,
      completed: 30,
      progress: 100,
      active: false,
      next: 'Semester complete',
      nextDue: '—',
    },
    {
      id: 4,
      name: 'Spring 2025',
      slug: 'spring-2025',
      dates: 'Feb 3 – May 30, 2025',
      courses: 4,
      assignments: 20,
      completed: 20,
      progress: 100,
      active: false,
      next: 'Semester complete',
      nextDue: '—',
    },
    {
      id: 5,
      name: 'Fall 2024',
      slug: 'fall-2024',
      dates: 'Sep 2 – Dec 20, 2024',
      courses: 5,
      assignments: 26,
      completed: 26,
      progress: 100,
      active: false,
      next: 'Semester complete',
      nextDue: '—',
    },
  ]
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
    />

    <div class="flex items-center gap-2 border-t border-line bg-soft px-5 py-4 font-mono text-[10px] text-text-muted">
      <Plus class="h-3.5 w-3.5" />
      Add an assignment
    </div>
  </div>
</template>
