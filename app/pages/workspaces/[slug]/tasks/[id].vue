<script setup lang="ts">
  import { CalendarIcon, Check, Dot, Pencil, RefreshCcw, Trash2 } from '@lucide/vue'
  import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
  import type { DateValue } from '@internationalized/date'
  import { useMediaQuery } from '@vueuse/core'
  import { displayToISO, taskPriorityToForm } from '~/components/workspaces/task-detail/taskDetailUtils.ts'
  import { cn } from '~/lib/utils'
  import { editPriorities, getUrgency, priorityDotColor, statusStyles } from '~/utils/taskDisplay'
  import type { BreadcrumbEntry, TaskPriority } from '~/types'
  import type { Ref } from 'vue'
  import type { TaskDetailContext } from '~/components/workspaces/task-detail/taskDetailContext.ts'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  const route = useRoute()
  const slug = computed(() => route.params.slug as string)
  const listPath = computed(() => `/workspaces/${slug.value}/tasks`)

  const ctx = inject<TaskDetailContext>('workspace')!
  const breadcrumbExtra = inject<Ref<BreadcrumbEntry[]> | undefined>('breadcrumbExtra')
  const isDesktop = useMediaQuery('(min-width: 640px)')

  const task = computed(() => ctx.tasks.value.find(t => t.id === Number(route.params.id)))

  if (!task.value) {
    // Fatal only on the client: a fatal SSR error tears down the dev server.
    throw createError({ statusCode: 404, statusMessage: 'Task not found', fatal: import.meta.client })
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

  const nextStatus = computed(() => {
    const s = task.value?.status
    return s === 'To do' ? 'In progress' : s === 'In progress' ? 'Done' : 'To do'
  })

  const isEditingHeader = ref(false)
  const editTitle = ref('')
  const editCourse = ref('')
  const editDue = ref<DateValue | undefined>(undefined)
  const editPriority = ref<TaskPriority>('medium')
  const editDescription = ref('')
  const calendarOpen = ref(false)

  const quickDueDates = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'Next week', days: 7 },
  ]

  const dueLabel = computed(() =>
    editDue.value
      ? editDue.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Pick a date',
  )

  const isPastDue = computed(() => !!editDue.value && editDue.value.compare(today(getLocalTimeZone())) < 0)

  const canSaveHeader = computed(() => !!editTitle.value.trim() && !!editCourse.value.trim() && !!editDue.value)

  function startEditHeader() {
    const t = task.value
    if (!t)
      return
    editTitle.value = t.task
    editCourse.value = t.course
    const isoDue = displayToISO(t.due)
    editDue.value = isoDue ? parseDate(isoDue) : undefined
    editPriority.value = taskPriorityToForm[t.priority] ?? 'medium'
    editDescription.value = t.description ?? ''
    calendarOpen.value = false
    isEditingHeader.value = true
  }

  function saveHeader() {
    if (!task.value || !canSaveHeader.value)
      return
    ctx.updateTask(task.value.id, {
      title: editTitle.value.trim(),
      course: editCourse.value.trim(),
      due: editDue.value ? editDue.value.toString() : '',
      priority: editPriority.value,
      description: editDescription.value.trim(),
      submissionUrl: '',
    })
    isEditingHeader.value = false
  }

  function setDueIn(days: number) {
    editDue.value = today(getLocalTimeZone()).add({ days })
    calendarOpen.value = false
  }

  function cancelEditHeader() {
    isEditingHeader.value = false
  }

  function onEditDrawerChange(open: boolean) {
    if (!open)
      cancelEditHeader()
  }

  function onEditPriorityChange(value: unknown) {
    if (value)
      editPriority.value = value as TaskPriority
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
    <div v-if="task" class="space-y-6">
      <div class="grid items-start gap-x-6 gap-y-6 xl:relative xl:grid-cols-[1.6fr_1fr] xl:gap-y-0">
        <div class="flex flex-wrap items-center justify-between gap-2 xl:contents">
          <div class="min-w-0 xl:col-start-1 xl:row-start-1 xl:pr-56">
            <p v-if="!isEditingHeader || !isDesktop" class="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
            {{ task.course }}
          </p>
          <Input
            v-else
            v-model="editCourse"
            aria-label="Course"
              class="h-8 max-w-xs text-xs"
            placeholder="e.g. Design Research"
            @keydown.enter.prevent="saveHeader"
            @keydown.escape.prevent="cancelEditHeader"
          />
          </div>
          <div
            class="flex shrink-0 flex-wrap items-center gap-1.5 xl:absolute xl:right-0 xl:top-0"
          >
            <template v-if="!isEditingHeader">
              <Button v-if="!(task.checklist?.length)" size="sm" variant="outline" class="max-sm:w-8 max-sm:px-0" :aria-label="`Mark as ${nextStatus}`" @click="ctx.cycleStatus(task)">
                <RefreshCcw class="size-3.5 sm:mr-2" />
                <span class="max-sm:hidden">Mark as {{ nextStatus }}</span>
              </Button>
              <Button size="sm" variant="outline" class="max-sm:w-8 max-sm:px-0" aria-label="Edit task" @click="startEditHeader">
                <Pencil class="size-3.5 sm:mr-2" />
                <span class="max-sm:hidden">Edit</span>
              </Button>
            </template>
            <template v-else>
              <Button size="sm" variant="outline" class="max-sm:hidden" @click="cancelEditHeader">
                Cancel
              </Button>
              <Button size="sm" class="max-sm:hidden" :disabled="!canSaveHeader" @click="saveHeader">
                <Check class="mr-2 size-3.5" />
                Save
            </Button>
          </template>
        </div>
        </div>

        <div class="max-xl:-mt-8 xl:col-start-1 xl:row-start-2">
          <h1 v-if="!isEditingHeader || !isDesktop" class="mt-2 text-2xl font-bold tracking-tight text-headline">
            {{ task.task }}
          </h1>
          <Input
            v-else
            v-model="editTitle"
            aria-label="Title"
            class="mt-2 h-9 max-w-2xl text-lg font-bold tracking-tight"
            placeholder="e.g. Read chapter 4"
            @keydown.enter.prevent="saveHeader"
            @keydown.escape.prevent="cancelEditHeader"
          />
          <p v-if="(!isEditingHeader || !isDesktop) && task.description" class="mt-3 max-w-2xl text-sm leading-relaxed text-subline">
            {{ task.description }}
          </p>
          <p v-else-if="!isEditingHeader || !isDesktop" class="mt-3 text-sm text-text-muted">
            No description yet.
          </p>
          <Input
            v-else
            v-model="editDescription"
            aria-label="Description"
            class="mt-3 h-9 max-w-2xl text-sm"
            placeholder="What needs to be done?"
            @keydown.enter.prevent="saveHeader"
            @keydown.escape.prevent="cancelEditHeader"
          />
          <div v-if="!isEditingHeader || !isDesktop" class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
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
        <div v-else class="mt-4 text-sm">
          <div class="flex flex-wrap items-center gap-2">
            <Popover v-model:open="calendarOpen">
              <PopoverTrigger as-child>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-7 gap-1.5 px-2.5 text-[11px] font-normal"
                  :class="!editDue && 'text-text-muted'"
                >
                  <CalendarIcon class="size-3.5" />
                  {{ dueLabel }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <!-- @vue-ignore: false-positive nominal-identity mismatch on DateValue classes under Volar (single installed copy verified at runtime); values are structurally identical -->
                <Calendar v-model="editDue" initial-focus @update:model-value="calendarOpen = false" />
                <div class="flex flex-wrap gap-1.5 border-t border-line p-2">
                  <Button
                    v-for="q in quickDueDates"
                    :key="q.label"
                    type="button"
                    variant="outline"
                    size="sm"
                    class="h-6 rounded-full px-2 text-[10px]"
                    @click="setDueIn(q.days)"
                  >
                    {{ q.label }}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <span class="text-xs text-text-muted">Priority:</span>
            <ToggleGroup
              type="single"
              variant="outline"
              :model-value="editPriority"
              @update:model-value="onEditPriorityChange"
            >
              <ToggleGroupItem v-for="p in editPriorities" :key="p.value" :value="p.value" class="h-7 gap-1.5 px-2.5 text-[11px]">
                <span class="size-1.5 rounded-full" :class="p.dot" />
                {{ p.label }}
              </ToggleGroupItem>
            </ToggleGroup>
            <Badge :class="cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyles[task.status] ?? statusStyles['To do'])">
              {{ task.status }}
            </Badge>
          </div>
          <p v-if="isPastDue" class="mt-1 text-[11px] text-urgency-overdue">
            This date is in the past — the task will show as overdue right away.
          </p>
        </div>
        </div>

          <WorkspacesTaskDetailChecklist :task="task" class="xl:col-start-1 xl:row-start-3 xl:mt-6" />

        <div class="space-y-6 xl:col-start-2 xl:row-start-3 xl:mt-6">
          <WorkspacesTaskDetailSubmissionLinks :task="task" />

          <WorkspacesTaskDetailNotes :task="task" />

          <WorkspacesTaskDetailLinkedMaterials :task="task" />
        </div>
      </div>

      <div class="flex border-t border-line pt-5 sm:justify-end">
        <Button
          variant="ghost"
          class="w-full text-destructive hover:text-destructive sm:w-auto"
          @click="deleteOpen = true"
        >
          <Trash2 class="mr-2 size-3.5" />
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

      <Drawer v-if="isEditingHeader && !isDesktop" :open="true" @update:open="onEditDrawerChange">
        <DrawerContent class="max-h-[85vh]">
          <DrawerHeader class="text-left">
            <DrawerTitle class="text-base">
              Edit task
            </DrawerTitle>
            <DrawerDescription class="sr-only">
              Edit task details.
            </DrawerDescription>
          </DrawerHeader>
          <div class="max-h-[70vh] space-y-4 overflow-y-auto px-4 pb-4">
            <div class="space-y-2">
              <Label class="text-xs">Course</Label>
              <Input v-model="editCourse" class="text-sm" placeholder="e.g. Design Research" />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Title</Label>
              <Input v-model="editTitle" class="text-sm font-semibold" placeholder="e.g. Read chapter 4" />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Description</Label>
              <Input v-model="editDescription" class="text-sm" placeholder="What needs to be done?" />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Due date</Label>
              <div class="flex items-center gap-2">
                <Popover v-model:open="calendarOpen">
                  <PopoverTrigger as-child>
                    <Button
                      type="button"
                      variant="outline"
                      class="h-9 flex-1 justify-start gap-2 text-sm font-normal"
                      :class="!editDue && 'text-text-muted'"
                    >
                      <CalendarIcon class="size-4" />
                      {{ dueLabel }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <!-- @vue-ignore: false-positive nominal-identity mismatch on DateValue classes under Volar (single installed copy verified at runtime); values are structurally identical -->
                    <Calendar v-model="editDue" initial-focus @update:model-value="calendarOpen = false" />
                    <div class="flex flex-wrap gap-1.5 border-t border-line p-2">
                      <Button
                        v-for="q in quickDueDates"
                        :key="q.label"
                        type="button"
                        variant="outline"
                        size="sm"
                        class="h-6 rounded-full px-2 text-[10px]"
                        @click="setDueIn(q.days)"
                      >
                        {{ q.label }}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p v-if="isPastDue" class="text-[11px] text-urgency-overdue">
                This date is in the past — the task will show as overdue right away.
              </p>
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Priority</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                class="grid w-full grid-cols-3"
                :model-value="editPriority"
                @update:model-value="onEditPriorityChange"
              >
                <ToggleGroupItem v-for="p in editPriorities" :key="p.value" :value="p.value" class="gap-2 text-xs">
                  <span class="size-1.5 rounded-full" :class="p.dot" />
                  {{ p.label }}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <DrawerFooter class="flex-row gap-2 pt-2">
            <Button variant="outline" class="flex-1" @click="cancelEditHeader">
              Cancel
            </Button>
            <Button class="flex-1" :disabled="!canSaveHeader" @click="saveHeader">
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  </main>
</template>
