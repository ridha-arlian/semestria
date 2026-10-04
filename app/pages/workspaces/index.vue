<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  import MaterialsView from '~/components/dashboard/MaterialsView.vue'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import type { Task, ModalType, Material, View, StatItem } from '~/types/dashboard'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces'
  })

  interface WorkspaceContext {
    view: Ref<View>
    tasks: Ref<Task[]>
    materials: Ref<Material[]>
    openAdd: (type: ModalType) => void
    cycleStatus: (item: Task) => void
    removeTask: (id: number) => void
  }

  const { view, tasks, materials, openAdd, cycleStatus, removeTask } = inject('workspace') as WorkspaceContext

  const completed = computed(() => tasks.value.filter(t => t.status === 'Done').length)
  const inProgress = computed(() => tasks.value.filter(t => t.status === 'In progress').length)

  // Catatan fokus per minggu: ganti minggu = otomatis kosong
  const currentWeek = 3
  const totalWeeks = 16
  const weeklyNotes = ref<Record<number, string>>({
    [currentWeek]: 'Finish the research proposal and review last week`s notes.',
  })

  const overviewStats = computed<StatItem[]>(() => [
    {
      label: 'Active tasks',
      value: String(tasks.value.filter(t => t.status !== 'Done').length),
      note: '2 due this week',
      to: '/tasks?status=active',
    },
    {
      label: 'Completed',
      value: String(completed.value),
      note: `of ${tasks.value.length} tasks`,
      to: '/tasks?status=completed',
    },
    {
      label: 'Study progress',
      value: '42%',
      note: 'Keep the rhythm going',
      to: null,
    },
    {
      label: 'Next deadline',
      value: '2 days',
      note: 'Research proposal',
      to: null,
    },
  ])
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div v-if="view === 'Overview'" class="space-y-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-lg font-bold tracking-tight text-headline sm:hidden">
          Fall 2026
        </h1>
        <h1 class="hidden text-2xl font-bold tracking-tight text-headline sm:block">
          Fall 2026
        </h1>

        <Button class="w-full sm:w-auto" @click="openAdd('task')">
          <Plus class="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      <OverviewStats :stats="overviewStats" />

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <WorkspacesOverviewTasks :tasks="tasks" @view-all="view = 'Tasks'" />
        <WorkspacesOverviewProgress
          :completed="completed"
          :in-progress="inProgress"
          :total="tasks.length"
          :current-week="currentWeek"
          :total-weeks="totalWeeks"
          :focus="weeklyNotes[currentWeek]"
          :next-deadline="{ title: 'Research proposal', dueIn: '2 days' }"
          @update:focus="weeklyNotes[currentWeek] = $event"
        />
      </div>
    </div>

    <DashboardTasksView
      v-else-if="view === 'Tasks'"
      :tasks="tasks"
      @add="openAdd('task')"
      @toggle-status="cycleStatus"
      @remove="removeTask"
    />

    <MaterialsView
      v-else
      :materials="materials"
      @add="openAdd('material')"
    />
  </main>
</template>