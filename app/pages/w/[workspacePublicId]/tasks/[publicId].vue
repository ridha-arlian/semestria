<script setup lang="ts">
  import { CircleCheck, CirclePlay, Dot, Pencil, RotateCcw, Trash2 } from '@lucide/vue'
  import { useMediaQuery } from '@vueuse/core'
  import { displayToISO, taskPriorityToForm } from '~/components/workspaces/task-detail/taskDetailUtils.ts'
  import { cn } from '~/lib/utils'
  import { getUrgency, priorityDotColor, statusStyles } from '~/utils/taskDisplay'
  import TaskForm from '~/components/workspaces/modal/TaskForm.vue'
  import type { BreadcrumbEntry, TaskPayload } from '~/types'
  import type { Ref } from 'vue'
  import type { TaskDetailContext } from '~/components/workspaces/task-detail/taskDetailContext.ts'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  const route = useRoute()
  const workspacePublicId = computed(() => route.params.workspacePublicId as string)
  const listPath = computed(() => `/w/${workspacePublicId.value}/tasks`)

  const ctx = inject<TaskDetailContext>('workspace')!
  const breadcrumbExtra = inject<Ref<BreadcrumbEntry[]> | undefined>('breadcrumbExtra')
  const isDesktop = useMediaQuery('(min-width: 640px)')

  const task = computed(() => ctx.tasks.value.find(t => t.publicId === route.params.publicId))

  const workspaceKey = computed(() => `workspace:${ctx.workspace.value?.id ?? 0}`)
  const { ready, showSkeleton, error } = useDataStatus(workspaceKey)

  // SSR always has the awaited data, so a missing task there is a real 404.
  // On the client the cache may still be loading; wait for hydration before
  // deciding, otherwise a valid deep link would 404 on a cold cache.
  if (import.meta.server && !task.value) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  watch([task, ready], ([value, isReady]) => {
    if (!value && isReady) {
      showError({ statusCode: 404, statusMessage: 'Task not found' })
    }
  }, { immediate: true })

  function retryWorkspace() {
    void fetchWorkspaceData(workspacePublicId.value, { force: true })
  }

  watch(() => task.value?.task, (name) => {
    if (breadcrumbExtra)
      breadcrumbExtra.value = name ? [{ label: name }] : []
  }, { immediate: true })

  onUnmounted(() => {
    if (breadcrumbExtra)
      breadcrumbExtra.value = []
  })

  const urgency = computed(() => task.value ? getUrgency(task.value.due, task.value.status) : null)

  const courses = computed(() => [...new Set([...ctx.tasks.value, ...ctx.materials.value].map(i => i.course))])
  const workspaceStartDate = computed(() => ctx.workspace.value?.startDate)
  const workspaceEndDate = computed(() => ctx.workspace.value?.endDate)

  const nextStatus = computed(() => {
    const s = task.value?.status
    return s === 'To do' ? 'In progress' : s === 'In progress' ? 'Done' : 'To do'
  })

  const nextStatusIcon = computed(() =>
    nextStatus.value === 'In progress' ? CirclePlay : nextStatus.value === 'Done' ? CircleCheck : RotateCcw,
  )

  const editOpen = ref(false)
  const editInitial = computed<TaskPayload | null>(() => {
    const t = task.value
    if (!t)
      return null
    return {
      title: t.task,
      course: t.course,
      due: displayToISO(t.due),
      priority: taskPriorityToForm[t.priority] ?? 'medium',
      description: t.description ?? '',
      submissionUrl: '',
    }
  })

  function saveEdit(payload: TaskPayload) {
    if (!task.value)
      return
    ctx.updateTask(task.value.id, payload)
    editOpen.value = false
  }

  const deleteOpen = ref(false)

  function handleDelete() {
    if (!task.value)
      return
    ctx.removeTask(task.value.id)
    navigateTo(listPath.value)
  }

</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <SkeletonsContentError
      v-if="error"
      :message="error"
      @retry="retryWorkspace"
    />

    <SkeletonsDetailSkeleton v-else-if="showSkeleton" />

    <div v-else-if="task" class="flex flex-col gap-6 content-fade-in">
      <div class="grid items-start gap-x-6 gap-y-6 xl:relative xl:grid-cols-[1.6fr_1fr] xl:gap-y-0">
        <div class="min-w-0 xl:col-start-1 xl:row-start-1 xl:pr-56">
          <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
            {{ task.course }}
          </p>
        </div>

        <div class="max-xl:-mt-4 xl:col-start-1 xl:row-start-2">
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-headline">
            {{ task.task }}
          </h1>
          <p v-if="task.description" class="mt-3 max-w-2xl text-sm leading-relaxed text-subline">
            {{ task.description }}
          </p>
          <p v-else class="mt-3 text-sm text-text-muted">
            No description yet.
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Tooltip>
              <TooltipTrigger as-child>
                <Dot
                  :class="cn('size-4 shrink-0', priorityDotColor[task.priority] ?? priorityDotColor.Low)"
                  :stroke-width="8"
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {{ task.priority }} priority
              </TooltipContent>
            </Tooltip>
            <span v-if="urgency" :class="cn('font-medium', urgency.class)">
              {{ urgency.label }}
            </span>
            <span class="text-subline">·</span>
            <span class="font-medium text-text-strong">{{ task.due }}</span>
            <span class="text-text-muted">|</span>
            <Badge :class="cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyles[task.status] ?? statusStyles['To do'])">
              {{ task.status }}
            </Badge>
          </div>
        </div>

        <div class="flex w-full shrink-0 items-center gap-1.5 sm:w-auto sm:justify-start xl:absolute xl:right-0 xl:top-0">
          <Button size="sm" variant="outline" class="max-sm:order-last max-sm:w-8 max-sm:px-0" aria-label="Edit task" @click="editOpen = true">
            <Pencil class="mr-2 size-3.5 max-sm:mr-0" />
            <span class="max-sm:hidden">Edit</span>
          </Button>
          <Button v-if="!(task.checklist?.length)" size="sm" class="flex-1 sm:flex-none" :aria-label="`Mark as ${nextStatus}`" @click="ctx.cycleStatus(task)">
            <component :is="nextStatusIcon" class="mr-2 size-3.5" />
            <span>Mark as {{ nextStatus }}</span>
          </Button>
        </div>

          <WorkspacesTaskDetailChecklist :task="task" class="xl:col-start-1 xl:row-start-3 xl:mt-6" />

        <div class="flex flex-col gap-6 xl:col-start-2 xl:row-start-3 xl:mt-6">
          <WorkspacesTaskDetailSubmissionLinks :task="task" />

          <WorkspacesTaskDetailNotes :task="task" />

          <WorkspacesTaskDetailLinkedMaterials :task="task" />
        </div>
      </div>

      <Separator />

      <div class="flex sm:justify-end">
        <Button
          variant="ghost"
          class="w-full text-destructive hover:text-destructive sm:w-auto"
          @click="deleteOpen = true"
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </div>

      <DeleteConfirmDialog
        v-model:open="deleteOpen"
        title="Delete this task?"
        confirm-label="Delete task"
        @confirm="handleDelete"
      >
        <template #description>
          Are you sure you want to delete <strong class="font-semibold text-destructive">"{{ task?.task }}"</strong>? This action can't be undone. Linked materials will be kept, but the link to this task will be removed.
        </template>
      </DeleteConfirmDialog>

      <Dialog v-if="isDesktop" :open="editOpen" @update:open="(v: boolean) => { if (!v) editOpen = false }">
        <DialogContent class="flex max-h-[90vh] max-w-md flex-col" @open-auto-focus.prevent>
          <DialogHeader>
            <DialogTitle class="text-base">
              Edit task
            </DialogTitle>
            <DialogDescription class="sr-only">
              Edit this task.
            </DialogDescription>
          </DialogHeader>
          <div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-1">
            <TaskForm
              v-if="editOpen && editInitial"
              key="edit"
              :courses="courses"
              :start-date="workspaceStartDate"
              :end-date="workspaceEndDate"
              :initial="editInitial"
              submit-label="Save changes"
              @cancel="editOpen = false"
              @submit="saveEdit"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Drawer v-else :open="editOpen" @update:open="(v: boolean) => { if (!v) editOpen = false }">
        <DrawerContent @open-auto-focus.prevent>
          <DrawerHeader class="text-left">
            <DrawerTitle class="text-base">
              Edit task
            </DrawerTitle>
            <DrawerDescription class="sr-only">
              Edit this task.
            </DrawerDescription>
          </DrawerHeader>
          <div class="max-h-[75vh] overflow-y-auto px-4 pb-6">
            <TaskForm
              v-if="editOpen && editInitial"
              key="edit"
              :courses="courses"
              :start-date="workspaceStartDate"
              :end-date="workspaceEndDate"
              :initial="editInitial"
              submit-label="Save changes"
              @cancel="editOpen = false"
              @submit="saveEdit"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  </main>
</template>
