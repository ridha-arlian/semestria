<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import type { Task, ModalType, StatItem, Workspace } from '~/types'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  interface WorkspaceContext {
    workspace: Ref<Workspace | undefined>
    week: Ref<{ current: number, total: number } | null>
    tasks: Ref<Task[]>
    openAdd: (type: ModalType) => void
  }

  const { workspace, week, tasks, openAdd } = inject('workspace') as WorkspaceContext

  const base = computed(() => `/workspaces/${workspace.value?.slug}`)

  const completed = computed(() => tasks.value.filter(t => t.status === 'Done').length)
  const inProgress = computed(() => tasks.value.filter(t => t.status === 'In progress').length)

  const weeklyNotes = ref<Record<string, string>>({})
  const noteKey = computed(() => `${workspace.value?.slug}-${week.value?.current ?? 0}`)
  const focus = computed(() => weeklyNotes.value[noteKey.value] ?? '')

  const DAY = 24 * 60 * 60 * 1000
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pending = computed(() =>
    tasks.value
      .filter(t => t.status !== 'Done')
      .map(t => ({ task: t, time: new Date(t.due).getTime() }))
      .filter(x => !Number.isNaN(x.time))
      .sort((a, b) => a.time - b.time),
  )

  const upcoming = computed(() => pending.value.filter(x => x.time >= today.getTime()))
  const dueThisWeek = computed(() => upcoming.value.filter(x => x.time - today.getTime() < 7 * DAY).length)

  const nextDeadline = computed(() => {
    const next = upcoming.value[0]
    if (!next) return { title: 'No upcoming deadline', dueIn: '—' }

    const days = Math.round((next.time - today.getTime()) / DAY)
    const dueIn = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`
    return { title: next.task.task, dueIn }
  })

  const overviewStats = computed<StatItem[]>(() => [
    {
      label: 'Active tasks',
      value: String(tasks.value.filter(t => t.status !== 'Done').length),
      note: `${dueThisWeek.value} due this week`,
      to: `${base.value}/tasks?status=active`,
    },
    {
      label: 'Completed',
      value: String(completed.value),
      note: `of ${tasks.value.length} tasks`,
      to: `${base.value}/tasks?status=completed`,
    },
    {
      label: 'Study progress',
      value: `${workspace.value?.progress ?? 0}%`,
      note: 'Keep the rhythm going',
      to: null,
    },
    {
      label: 'Next deadline',
      value: nextDeadline.value.dueIn,
      note: nextDeadline.value.title,
      to: null,
    },
  ])
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div class="space-y-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-lg font-bold tracking-tight text-headline sm:hidden">
          {{ workspace?.name }}
        </h1>
        <h1 class="hidden text-2xl font-bold tracking-tight text-headline sm:block">
          {{ workspace?.name }}
        </h1>

        <Button class="w-full sm:w-auto" @click="openAdd('task')">
          <Plus class="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      <OverviewStats :stats="overviewStats" />

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <WorkspacesOverviewTasks :tasks="tasks" />
        <WorkspacesOverviewProgress
          :completed="completed"
          :in-progress="inProgress"
          :total="tasks.length"
          :current-week="week?.current ?? 0"
          :total-weeks="week?.total ?? 0"
          :focus="focus"
          :next-deadline="nextDeadline"
          @update:focus="weeklyNotes[noteKey] = $event"
        />
      </div>
    </div>
  </main>
</template>