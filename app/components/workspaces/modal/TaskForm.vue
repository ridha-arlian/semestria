<script setup lang="ts">
  import { fromDate, getLocalTimeZone, parseDate, toCalendarDate, today } from '@internationalized/date'
  import type { DateValue } from '@internationalized/date'
  import { CalendarIcon, ChevronDown, Plus } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import { editPriorities } from '~/utils/taskDisplay'
  import { displayToISO } from '~/components/workspaces/task-detail/taskDetailUtils'
  import type { TaskPayload, TaskPriority } from '~/types'

  const props = defineProps<{
    courses?: string[]
    autofocus?: boolean
    startDate?: string
    endDate?: string
    initial?: TaskPayload | null
    submitLabel?: string
  }>()

  const emit = defineEmits<{
    cancel: []
    submit: [payload: TaskPayload, addAnother: boolean]
  }>()

  const title = ref('')
  const course = ref('')
  const courseOpen = ref(false)
  const courseQuery = ref('')
  const due = ref<DateValue | undefined>(undefined)
  const priority = ref<TaskPriority>('medium')
  const description = ref('')
  const submissionUrl = ref('')
  const showMore = ref(false)
  const calendarOpen = ref(false)
  const titleEl = ref<InstanceType<typeof Input> | null>(null)

  const showCourseInput = computed(() => !props.courses?.length)
  const canSubmit = computed(() => !!title.value.trim() && !!course.value.trim())
  const isPast = computed(() => !!due.value && due.value.compare(today(getLocalTimeZone())) < 0)

  function applyInitial() {
    const init = props.initial
    if (!init)
      return
    title.value = init.title
    course.value = init.course
    const isoDue = displayToISO(init.due)
    due.value = isoDue ? parseDate(isoDue) : undefined
    priority.value = init.priority
    description.value = init.description
    submissionUrl.value = init.submissionUrl
  }

  watch(() => props.initial, applyInitial)

  const workspaceStart = computed(() => props.startDate ? new Date(`${props.startDate}T00:00:00`) : null)
  const workspaceEnd = computed(() => props.endDate ? new Date(`${props.endDate}T00:00:00`) : null)
  const hasWorkspaceRange = computed(() =>
    !!workspaceStart.value && !!workspaceEnd.value && workspaceEnd.value.getTime() > workspaceStart.value.getTime(),
  )

  const dueDay = computed(() => due.value ? due.value.toDate(getLocalTimeZone()) : null)

  const dueLabel = computed(() =>
    dueDay.value
      ? dueDay.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Pick a date',
  )

  const outsideRange = computed(() => {
    if (!hasWorkspaceRange.value || !dueDay.value) return false
    const time = dueDay.value.getTime()
    return time < workspaceStart.value!.getTime() || time > workspaceEnd.value!.getTime()
  })

  const semesterRangeLabel = computed(() => {
    if (!hasWorkspaceRange.value) return ''
    const start = workspaceStart.value!
    const end = workspaceEnd.value!
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} — ${endLabel}`
  })

  const quickDates = computed(() => {
    if (!hasWorkspaceRange.value) return []
    const start = workspaceStart.value!
    const end = workspaceEnd.value!
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const chips = [
      { label: `Start · ${shortDate(start)}`, date: start },
      { label: `End of week 1 · ${shortDate(addDays(start, 6))}`, date: addDays(start, 6) },
      { label: `Semester end · ${shortDate(end)}`, date: end },
    ]
    return chips.filter(chip => chip.date.getTime() >= todayStart.getTime())
  })

  const filteredCourses = computed(() => {
    const query = courseQuery.value.trim().toLowerCase()
    const list = props.courses ?? []
    if (!query) return list
    return list.filter(item => item.toLowerCase().includes(query))
  })

  const exactCourseMatch = computed(() => {
    const query = courseQuery.value.trim().toLowerCase()
    if (!query) return undefined
    return (props.courses ?? []).find(item => item.toLowerCase() === query)
  })

  const canCreateCourse = computed(() => {
    const query = courseQuery.value.trim()
    return query.length > 0 && !exactCourseMatch.value
  })

  function shortDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function addDays(date: Date, days: number) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
  }

  watch(courseOpen, (open) => {
    if (!open)
      courseQuery.value = ''
  })

  function focusTitle() {
    nextTick(() => (titleEl.value?.$el as HTMLInputElement | undefined)?.focus())
  }

  onMounted(() => {
    applyInitial()
    if (props.autofocus)
      focusTitle()
  })

  function setDue(day: Date) {
    due.value = toCalendarDate(fromDate(day, getLocalTimeZone()))
    calendarOpen.value = false
  }

  function onPriorityChange(value: unknown) {
    if (value)
      priority.value = value as TaskPriority
  }

  function handleSubmit(addAnother = false) {
    if (!canSubmit.value)
      return
    emit('submit', {
      title: title.value.trim(),
      course: course.value.trim(),
      due: due.value ? due.value.toString().slice(0, 10) : '',
      priority: priority.value,
      description: description.value.trim(),
      submissionUrl: submissionUrl.value.trim(),
    }, addAnother)
    if (addAnother) {
      title.value = ''
      due.value = undefined
      description.value = ''
      submissionUrl.value = ''
      if (props.autofocus)
        focusTitle()
    }
  }
</script>

<template>
  <form
    class="flex flex-col gap-7"
    @submit.prevent="handleSubmit(false)"
    @keydown.ctrl.enter.prevent="handleSubmit(false)"
    @keydown.meta.enter.prevent="handleSubmit(false)"
  >
    <FieldGroup class="gap-5">
      <Field class="gap-2">
        <FieldLabel for="task-title" class="text-xs">
          Title <span aria-hidden="true" class="text-urgency-overdue">*</span>
        </FieldLabel>
        <Input id="task-title" ref="titleEl" v-model="title" class="text-sm" placeholder="e.g. Read chapter 4" aria-required="true" />
      </Field>

      <Field class="gap-2">
        <FieldLabel for="task-course" class="text-xs">
          Course <span aria-hidden="true" class="text-urgency-overdue">*</span>
        </FieldLabel>
        <Combobox
          v-if="!showCourseInput"
          v-model="course"
          v-model:open="courseOpen"
          ignore-filter
        >
          <ComboboxAnchor as-child class="w-full">
            <ComboboxTrigger as-child>
              <Button
                id="task-course"
                type="button"
                variant="outline"
                class="w-full justify-between font-normal"
                :class="!course && 'text-muted-foreground'"
              >
                <span class="truncate">{{ course || 'Select a course' }}</span>
                <ChevronDown data-icon="inline-end" class="opacity-50" />
              </Button>
            </ComboboxTrigger>
          </ComboboxAnchor>
          <ComboboxList align="start" class="w-(--reka-popper-anchor-width) p-0">
            <ComboboxInput
              v-model="courseQuery"
              placeholder="Search or create..."
              class="h-8 text-sm"
            />
            <ComboboxGroup class="max-h-56 overflow-y-auto">
              <ComboboxItem
                v-for="item in filteredCourses"
                :key="item"
                :value="item"
                class="text-sm"
              >
                {{ item }}
              </ComboboxItem>
              <ComboboxItem
                v-if="canCreateCourse"
                :value="courseQuery.trim()"
                class="gap-1.5 text-sm text-text-strong"
              >
                <Plus class="size-3.5" />
                Create "{{ courseQuery.trim() }}"
              </ComboboxItem>
            </ComboboxGroup>
            <p v-if="!filteredCourses.length && !canCreateCourse" class="px-3 py-4 text-xs text-subline">
              Type a course name to create it.
            </p>
          </ComboboxList>
        </Combobox>
        <Input
          v-else
          id="task-course"
          v-model="course"
          class="text-sm"
          placeholder="e.g. Design Research"
          aria-required="true"
        />
      </Field>

      <Field class="gap-2">
        <FieldLabel class="text-xs">Due date <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <Popover v-model:open="calendarOpen">
          <PopoverTrigger as-child>
            <Button
              type="button"
              variant="outline"
              class="w-full justify-start font-normal"
              :class="!due && 'text-muted-foreground'"
            >
              <CalendarIcon data-icon="inline-start" />
              {{ dueLabel }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <!-- @vue-ignore: false-positive nominal-identity mismatch on DateValue classes under Volar (single installed copy verified at runtime); values are structurally identical -->
            <Calendar v-model="due" initial-focus @update:model-value="calendarOpen = false" />
          </PopoverContent>
        </Popover>
        <div v-if="quickDates.length" class="flex flex-wrap gap-1.5">
          <Button
            v-for="q in quickDates"
            :key="q.label"
            type="button"
            variant="outline"
            size="sm"
            class="h-7 rounded-full px-2.5 text-[11px]"
            @click="setDue(q.date)"
          >
            {{ q.label }}
          </Button>
        </div>
        <p v-if="outsideRange && !isPast" class="text-[11px] text-urgency-due">
          Outside the semester ({{ semesterRangeLabel }})
        </p>
        <p v-if="isPast" class="text-[11px] text-urgency-overdue">
          This date is in the past — the task will show as overdue right away.
        </p>
      </Field>

      <Field class="gap-2">
        <FieldLabel class="text-xs">Priority</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          class="grid w-full grid-cols-3"
          :model-value="priority"
          @update:model-value="onPriorityChange"
        >
          <ToggleGroupItem
            v-for="p in editPriorities"
            :key="p.value"
            :value="p.value"
            class="gap-2 text-xs"
          >
            <span class="size-1.5 rounded-full" :class="p.dot" />
            {{ p.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <Collapsible v-model:open="showMore">
        <CollapsibleTrigger as-child>
          <Button type="button" variant="ghost" size="sm" class="-ml-2 gap-1 text-xs text-muted-foreground">
            More options
            <ChevronDown data-icon="inline-end" class="transition-transform" :class="showMore && 'rotate-180'" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-2 flex flex-col gap-5">
          <Field class="gap-2">
            <FieldLabel for="task-notes" class="text-xs">Description <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
            <Textarea
              id="task-notes"
              v-model="description"
              rows="3"
              class="resize-none text-sm"
              placeholder="Short details, links, or notes from your lecturer"
            />
          </Field>
          <Field v-if="!props.initial" class="gap-2">
            <FieldLabel for="task-submission" class="text-xs">Submission link <span class="font-normal text-muted-foreground">(optional — more can be added later)</span></FieldLabel>
            <Input
              id="task-submission"
              v-model="submissionUrl"
              type="url"
              class="text-sm"
              placeholder="https://classroom.google.com/..."
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button v-if="!props.initial" type="button" variant="ghost" :disabled="!canSubmit" @click="handleSubmit(true)">
        Create & add another
      </Button>
      <span v-else />
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1 sm:flex-none" @click="emit('cancel')">
          Cancel
        </Button>
        <Button type="submit" class="flex-1 sm:flex-none" :disabled="!canSubmit">
          {{ props.submitLabel ?? 'Add task' }}
        </Button>
      </div>
    </div>
  </form>
</template>