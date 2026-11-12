<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import type { Task, ModalType, StatItem, Workspace, WorkspaceTimeline } from '~/types'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  interface WorkspaceContext {
    workspace: Ref<Workspace | undefined>
    week: Ref<WorkspaceTimeline | null>
    tasks: Ref<Task[]>
    taskLimitReached?: boolean
    openAdd: (type: ModalType) => void
    cycleStatus: (item: Task) => void
  }

  const { workspace, week, tasks, taskLimitReached, openAdd, cycleStatus } = inject('workspace') as WorkspaceContext
  const api = useApi()
  const route = useRoute()

  const base = computed(() => `/w/${workspace.value?.publicId}`)
  const workspaceKey = computed(() => `workspace:${workspace.value?.id ?? 0}`)
  const { ready, showSkeleton, error } = useDataStatus(workspaceKey)

  function retryWorkspace() {
    void fetchWorkspaceData(route.params.workspacePublicId as string, { force: true })
  }

  function taskUrl(item: Task) {
    return `${window.location.origin}${base.value}/tasks/${item.publicId}`
  }

  async function handleShareLink(item: Task) {
    const url = taskUrl(item)
    try {
      await navigator.clipboard.writeText(url)
    }
    catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      }
      catch {
        // Silent: no toast infra yet.
      }
      document.body.removeChild(ta)
    }
  }

  const completed = computed(() => tasks.value.filter(t => t.status === 'Done').length)
  const inProgress = computed(() => tasks.value.filter(t => t.status === 'In progress').length)

  const focus = computed(() => {
    const key = String(week.value?.current ?? 0)
    return workspace.value?.focusNotes?.[key] ?? ''
  })

  async function updateFocus(value: string) {
    const ws = workspace.value
    if (!ws)
      return
    try {
      await api.setWorkspaceFocus(ws.id, week.value?.current ?? 0, value)
    }
    catch {
      // Keep the previous note; the editor already closed optimistically.
    }
  }

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
    <SkeletonsContentError
      v-if="error"
      :message="error"
      @retry="retryWorkspace"
    />

    <div v-else-if="!ready" class="flex flex-col gap-8">
      <template v-if="showSkeleton">
        <SkeletonsPageHeaderSkeleton with-action />

        <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
          <Skeleton v-for="index in 4" :key="index" class="h-24" />
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton class="h-72" />
          <Skeleton class="h-72" />
        </div>
      </template>
    </div>

    <div v-else class="flex flex-col gap-8 content-fade-in">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-lg font-bold tracking-tight text-headline sm:hidden">
          {{ workspace?.name }}
        </h1>
        <h1 class="hidden text-2xl font-bold tracking-tight text-headline sm:block">
          {{ workspace?.name }}
        </h1>

        <Button class="w-full sm:w-auto" :disabled="taskLimitReached" :title="taskLimitReached ? 'Demo limit reached (10 tasks)' : undefined" @click="openAdd('task')">
          <Plus data-icon="inline-start" />
          New task
        </Button>
      </div>

      <OverviewStats :stats="overviewStats" />

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <WorkspacesOverviewTasks
          :tasks="tasks"
          :view-all-to="`${base}/tasks`"
          @change-status="cycleStatus"
          @share="handleShareLink"
        />
        <WorkspacesOverviewProgress
          :completed="completed"
          :in-progress="inProgress"
          :total="tasks.length"
          :days-elapsed="week?.daysElapsed ?? 0"
          :days-total="week?.totalDays ?? 0"
          :days-until-start="week?.daysUntilStart ?? 0"
          :state="week?.state ?? 'active'"
          :focus="focus"
          :next-deadline="nextDeadline"
          @update:focus="updateFocus"
        />
      </div>
    </div>
  </main>
</template>