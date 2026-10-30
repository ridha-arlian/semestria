<script setup lang="ts">
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
  import { CalendarIcon } from '@lucide/vue'
  import type { DateRange } from 'reka-ui'
  import type { Workspace, WorkspaceFormPayload } from '~/types'

  const props = defineProps<{
    workspaceToEdit?: Workspace | null
  }>()

  const isOpen = defineModel<boolean>('open', { default: false })

  const emit = defineEmits<{
    (e: 'success', data: WorkspaceFormPayload): void
    (e: 'close'): void
  }>()

  const isEdit = computed(() => !!props.workspaceToEdit)

  const df = new DateFormatter('en-US', { dateStyle: 'medium' })

  const form = ref({
    name: '',
    isActive: true,
  })

  // `shallowRef` keeps the `DateValue` instances intact — a deep `ref()` would
  // unwrap their readonly members and lose the nominal type.
  const dateRange = shallowRef<DateRange>({
    start: undefined,
    end: undefined,
  })

  watch([isOpen, () => props.workspaceToEdit], ([open, workspace]) => {
    if (open) {
      if (workspace) {
        form.value.name = workspace.name
        form.value.isActive = workspace.active
        dateRange.value = {
          start: workspace.startDate ? parseDate(workspace.startDate) : undefined,
          end: workspace.endDate ? parseDate(workspace.endDate) : undefined,
        }
      }
      else {
        resetForm()
      }
    }
  })

  const rangeLabel = computed(() => {
    if (dateRange.value.start && dateRange.value.end) {
      return `${df.format(dateRange.value.start.toDate(getLocalTimeZone()))} - ${df.format(dateRange.value.end.toDate(getLocalTimeZone()))}`
    }
    if (dateRange.value.start) {
      return df.format(dateRange.value.start.toDate(getLocalTimeZone()))
    }
    return 'Pick a date range'
  })

  function toIsoString(date: DateRange['start']) {
    if (!date) return ''
    // `toDate()` converts to the local timezone; `toISOString()` would shift the
    // day backwards for positive UTC offsets, so read the local parts instead.
    const d = date.toDate(getLocalTimeZone())
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const day = `${d.getDate()}`.padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
  }

  function resetForm() {
    form.value = { name: '', isActive: true }
    dateRange.value = { start: undefined, end: undefined }
  }

  function handleSubmit() {
    emit('success', {
      ...form.value,
      startDate: toIsoString(dateRange.value.start),
      endDate: toIsoString(dateRange.value.end),
    })

    isOpen.value = false
    resetForm()
  }

  function handleOpenChange(val: boolean) {
    isOpen.value = val
    if (!val) emit('close')
  }
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-106.25">
      <DialogHeader>
        <DialogTitle>
          {{ isEdit ? 'Edit workspace' : 'Create new workspace' }}
        </DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Update your workspace details and timeline.' : 'Set up a new workspace to track your courses, assignments, and progress.' }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="name">
            Workspace name
          </Label>
          <Input
            id="name"
            v-model="form.name"
            placeholder="e.g. Fall 2026 or Frontend Bootcamp"
            required
          />
        </div>

        <div class="space-y-2">
          <Label>
            Workspace duration
          </Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                type="button"
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="!dateRange.start && 'text-subline'"
              >
                <CalendarIcon class="mr-2 size-4" />
                {{ rangeLabel }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <RangeCalendar v-model="dateRange" :number-of-months="2" />
            </PopoverContent>
          </Popover>
        </div>

        <div class="flex items-center justify-between rounded-lg border border-line p-3">
          <div class="space-y-0.5">
            <Label class="text-sm">
              Set as active workspace
            </Label>
            <p class="text-[12px] text-subline">
              Make this your current active workspace.
            </p>
          </div>
          <Switch v-model:checked="form.isActive" />
        </div>

        <DialogFooter class="pt-2">
          <Button type="button" variant="outline" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button type="submit">
            {{ isEdit ? 'Save changes' : 'Create workspace' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>