<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  // import { computed, inject } from 'vue'
  // import { Button } from '@/components/ui/button'
  import AssignmentsView from '~/components/dashboard/AssignmentsView.vue'
  import MaterialsView from '~/components/dashboard/MaterialsView.vue'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import SemesterProgress from '~/components/dashboard/SemesterProgress.vue'
  // import UpcomingAssignments from '~/components/workspaces/UpcomingAssignments.vue'
  import type { Assignment, ModalType, Material, View, StatItem } from '~/types/dashboard'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces'
  })

  interface WorkspaceContext {
    view: Ref<View>
    assignments: Ref<Assignment[]>
    materials: Ref<Material[]>
    openAdd: (type: ModalType) => void
    cycleStatus: (item: Assignment) => void
    removeAssignment: (id: number) => void
  }

  const { view, assignments, materials, openAdd, cycleStatus, removeAssignment } = inject('workspace') as WorkspaceContext

  const completed = computed(() => assignments.value.filter(a => a.status === 'Done').length)

  const overviewStats = computed<StatItem[]>(() => [
    {
      label: 'Active assignments',
      value: String(assignments.value.filter(a => a.status !== 'Done').length),
      note: '2 due this week',
      to: '/assignments?status=active',
    },
    {
      label: 'Completed',
      value: String(completed.value),
      note: `of ${assignments.value.length} assignments`,
      to: '/assignments?status=completed',
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
  
        <Button class="w-full sm:w-auto">
          <Plus class="mr-2 h-4 w-4" />
          New assignment
        </Button>
      </div>

      <OverviewStats :stats="overviewStats" />

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <WorkspacesUpcomingAssignments :assignments="assignments" @view-all="view = 'Assignments'" />
        <SemesterProgress
          :completed="completed"
          :total="assignments.length"
          @add-material="openAdd('material')"
        />
      </div>
    </div>

    <AssignmentsView
      v-else-if="view === 'Assignments'"
      :assignments="assignments"
      @add="openAdd('assignment')"
      @toggle-status="cycleStatus"
      @remove="removeAssignment"
    />

    <MaterialsView
      v-else
      :materials="materials"
      @add="openAdd('material')"
    />
  </main>
</template>