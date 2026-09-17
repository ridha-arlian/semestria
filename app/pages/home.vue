<script setup lang="ts">
  import { ArrowUpRight, CalendarDays, Check, Plus } from '@lucide/vue'

  definePageMeta({
    layout: 'home'
  })

  const workspaces = [
    { name: 'Fall 2026', dates: 'Aug 24 — Dec 18, 2026', courses: 4, assignments: 5, completed: 1, progress: 42, active: true, next: 'Research proposal', nextDue: 'Sep 12' },
    { name: 'Spring 2026', dates: 'Jan 12 — May 08, 2026', courses: 5, assignments: 18, completed: 16, progress: 88, active: false, next: 'Semester complete', nextDue: '—' },
    { name: 'Fall 2025', dates: 'Aug 25 — Dec 19, 2025', courses: 4, assignments: 21, completed: 21, progress: 100, active: false, next: 'Semester complete', nextDue: '—' },
  ]

  const totalAssignments = workspaces.reduce((sum, workspace) => sum + workspace.assignments, 0)
  const completedAssignments = workspaces.reduce((sum, workspace) => sum + workspace.completed, 0)
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p class="text-sm text-neutral-500">
          A clear view of everything you&apos;re studying, past and present.
        </p>
      </div>
      <button class="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-700">
        <Plus class="size-3.5" />
        New semester
      </button>
    </div>

    <div class="mt-8 grid gap-3 sm:grid-cols-3">
      <div v-for="stat in [{ label: 'Workspaces', value: workspaces.length, note: 'semesters in your space' }, { label: 'Assignments', value: totalAssignments, note: completedAssignments + ' completed overall' }, { label: 'Active semester', value: 'Fall 2026', note: 'Week 3 of 16' }]" :key="stat.label" class="rounded-lg border border-neutral-200 bg-white p-5">
        <p class="text-xs text-neutral-500">
          {{ stat.label }}
        </p>
        <p class="mt-4 text-2xl font-semibold tracking-tighter">
          {{ stat.value }}
        </p>
        <p class="mt-1 text-[11px] text-neutral-400">
          {{ stat.note }}
        </p>
      </div>
    </div>

    <section class="mt-8 rounded-lg border border-neutral-200 bg-white">
      <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 class="text-sm font-semibold">
            Your semesters
          </h2>
          <p class="mt-0.5 text-xs text-neutral-400">
            Open a workspace to continue where you left off.
          </p>
        </div>
        <button class="text-xs text-neutral-500 hover:text-neutral-900">
          Manage
        </button>
      </div>
      <div class="divide-y divide-neutral-100">
        <div v-for="workspace in workspaces" :key="workspace.name" class="grid gap-5 px-5 py-5 transition hover:bg-neutral-50 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center">
          <div>
            <div class="flex items-center gap-3">
              <h3 class="text-sm font-semibold">
                {{ workspace.name }}
              </h3>
              <span v-if="workspace.active" class="rounded-full bg-neutral-900 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                Current
              </span>
            </div>
            <p class="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-400">
              <CalendarDays class="size-3.5" />
              {{ workspace.dates }}
            </p>
          </div>
          <div>
            <div class="flex justify-between text-[11px] text-neutral-500">
              <span>
                Progress
              </span>
              <span class="font-mono">
                {{ workspace.progress }}
                %
              </span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div class="h-full rounded-full bg-neutral-900" :style="{ width: workspace.progress + '%' }" />
            </div>
          </div>
          <div class="text-[11px] text-neutral-500">
            <span class="font-semibold text-neutral-900">
              {{ workspace.assignments }}
            </span>
            assignments
            <span class="mx-1 text-neutral-300">
              ·
            </span>
            {{ workspace.courses }}
            courses
            <br />
            <span class="mt-1 inline-block text-neutral-400">
              {{ workspace.next }}
              {{ workspace.nextDue !== '—' ? ' · due ' + workspace.nextDue : '' }}
            </span>
          </div>
          <NuxtLink to="/dashboard" class="flex items-center gap-2 text-xs font-semibold text-neutral-500 transition hover:text-neutral-900">
            Open
            <ArrowUpRight class="size-3.5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <div class="mt-8 flex items-center gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
      <Check class="size-3.5 text-neutral-900" />
      All your semesters, assignments, and materials in one calm place.
    </div>
  </main>
</template>