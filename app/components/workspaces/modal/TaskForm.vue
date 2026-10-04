<script setup lang="ts">
  import { getLocalTimeZone, today } from '@internationalized/date'
  import type { DateValue } from '@internationalized/date'
  import { CalendarIcon, ChevronDown } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import type { TaskPayload, TaskPriority } from '~/types/dashboard'

  const props = defineProps<{
    courses?: string[]
    autofocus?: boolean
  }>()

  const emit = defineEmits<{
    cancel: []
    submit: [payload: TaskPayload, addAnother: boolean]
  }>()

  const NEW_COURSE = '__new__'

  const priorities: { value: TaskPriority, label: string, dot: string }[] = [
    { value: 'low', label: 'Low', dot: 'bg-neutral-400' },
    { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
    { value: 'high', label: 'High', dot: 'bg-red-500' },
  ]

  const quickDates = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'Next week', days: 7 },
  ]

  const title = ref('')
  const course = ref('')
  const addingCourse = ref(false)
  const due = ref<DateValue>()
  const priority = ref<TaskPriority>('medium')
  const description = ref('')
  const showMore = ref(false)
  const calendarOpen = ref(false)
  const titleEl = ref<InstanceType<typeof Input> | null>(null)

  const showCourseInput = computed(() => !props.courses?.length || addingCourse.value)
  const canSubmit = computed(() => !!title.value.trim() && !!course.value.trim())
  const isPast = computed(() => !!due.value && due.value.compare(today(getLocalTimeZone())) < 0)

  const dueLabel = computed(() =>
    due.value
      ? due.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Pick a date',
  )

  function focusTitle() {
    nextTick(() => (titleEl.value?.$el as HTMLInputElement | undefined)?.focus())
  }

  onMounted(() => {
    if (props.autofocus)
      focusTitle()
  })

  function setDueIn(days: number) {
    due.value = today(getLocalTimeZone()).add({ days })
    calendarOpen.value = false
  }

  function onCourseSelect(value: unknown) {
    if (value === NEW_COURSE) {
      addingCourse.value = true
      course.value = ''
    }
    else {
      addingCourse.value = false
      course.value = String(value ?? '')
    }
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
      due: due.value ? due.value.toString() : '',
      priority: priority.value,
      description: description.value.trim(),
    }, addAnother)
    if (addAnother) {
      title.value = ''
      due.value = undefined
      description.value = ''
      if (props.autofocus)
        focusTitle()
    }
  }
</script>

<template>
  <form
    class="space-y-6"
    @submit.prevent="handleSubmit(false)"
    @keydown.ctrl.enter.prevent="handleSubmit(false)"
    @keydown.meta.enter.prevent="handleSubmit(false)"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="task-title" class="text-xs">Title</Label>
        <Input id="task-title" ref="titleEl" v-model="title" class="text-sm" placeholder="e.g. Read chapter 4" />
      </div>

      <div class="space-y-2">
        <Label class="text-xs">Course</Label>
        <Select
          v-if="courses?.length"
          :model-value="addingCourse ? NEW_COURSE : course"
          @update:model-value="onCourseSelect"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in courses" :key="c" :value="c">
              {{ c }}
            </SelectItem>
            <SelectItem :value="NEW_COURSE">
              + New course
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="showCourseInput" v-model="course" class="text-sm" placeholder="e.g. Design Research" />
      </div>

      <div class="space-y-2">
        <Label class="text-xs">Due date <span class="font-normal text-muted-foreground">(optional)</span></Label>
        <Popover v-model:open="calendarOpen">
          <PopoverTrigger as-child>
            <Button
              type="button"
              variant="outline"
              class="w-full justify-start font-normal"
              :class="!due && 'text-muted-foreground'"
            >
              <CalendarIcon class="size-4" />
              {{ dueLabel }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar v-model="due" initial-focus @update:model-value="calendarOpen = false" />
          </PopoverContent>
        </Popover>
        <div class="flex flex-wrap gap-1.5">
          <Button
            v-for="q in quickDates"
            :key="q.label"
            type="button"
            variant="outline"
            size="sm"
            class="h-7 rounded-full px-2.5 text-[11px]"
            @click="setDueIn(q.days)"
          >
            {{ q.label }}
          </Button>
        </div>
        <p v-if="isPast" class="text-[11px] text-amber-600">
          Tanggal ini sudah lewat, task akan langsung tampil overdue.
        </p>
      </div>

      <div class="space-y-2">
        <Label class="text-xs">Priority</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          class="grid w-full grid-cols-3"
          :model-value="priority"
          @update:model-value="onPriorityChange"
        >
          <ToggleGroupItem v-for="p in priorities" :key="p.value" :value="p.value" class="gap-2 text-xs">
            <span class="size-1.5 rounded-full" :class="p.dot" />
            {{ p.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Collapsible v-model:open="showMore">
        <CollapsibleTrigger as-child>
          <Button type="button" variant="ghost" size="sm" class="-ml-2 gap-1 text-xs text-muted-foreground">
            More options
            <ChevronDown class="size-3.5 transition-transform" :class="showMore && 'rotate-180'" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-2 space-y-2">
          <Label for="task-notes" class="text-xs">Notes <span class="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="task-notes"
            v-model="description"
            rows="3"
            class="resize-none text-sm"
            placeholder="Detail singkat, link, atau catatan dosen"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="ghost" :disabled="!canSubmit" @click="handleSubmit(true)">
        Create & add another
      </Button>
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1 sm:flex-none" @click="emit('cancel')">
          Cancel
        </Button>
        <Button type="submit" class="flex-1 sm:flex-none" :disabled="!canSubmit">
          Add task
        </Button>
      </div>
    </div>
  </form>
</template>