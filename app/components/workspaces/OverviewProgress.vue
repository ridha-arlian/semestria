<script setup lang="ts">
  import { CalendarClock, Plus } from '@lucide/vue'

  const props = withDefaults(defineProps<{
    completed: number
    inProgress?: number
    total: number
    currentWeek?: number
    totalWeeks?: number
    focus?: string
    nextDeadline?: { title: string, dueIn: string }
  }>(), {
    inProgress: 0,
    focus: '',
  })

  const emit = defineEmits<{
    'update:focus': [value: string]
  }>()

  const pct = (value: number, max: number) => (max ? Math.round((value / max) * 100) : 0)

  const hasTime = computed(() => !!props.currentWeek && !!props.totalWeeks)
  const taskPercent = computed(() => pct(props.completed, props.total))
  const timePercent = computed(() => pct(props.currentWeek ?? 0, props.totalWeeks ?? 0))
  const toDo = computed(() => Math.max(props.total - props.completed - props.inProgress, 0))

  const pace = computed(() => {
    if (!hasTime.value) return null
    const diff = taskPercent.value - timePercent.value
    if (diff > 5) return { label: 'Ahead of schedule', dot: 'bg-status-done' }
    if (diff < -5) return { label: 'Behind schedule', dot: 'bg-urgency-overdue' }
    return { label: 'On track', dot: 'bg-status-idle' }
  })

  const segments = computed(() => [
    { key: 'done', label: 'Done', count: props.completed, class: 'bg-status-done' },
    { key: 'progress', label: 'In progress', count: props.inProgress, class: 'bg-status-progress' },
    { key: 'todo', label: 'To do', count: toDo.value, class: 'bg-status-idle/40' },
  ])

  const MAX_FOCUS = 140
  const editing = ref(false)
  const draft = ref('')
  const inputEl = ref<{ $el: HTMLTextAreaElement } | null>(null)
  let cancelled = false

  function startEdit() {
    draft.value = props.focus
    cancelled = false
    editing.value = true
    nextTick(() => {
      const el = inputEl.value?.$el
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
      if (window.matchMedia('(max-width: 767px)').matches)
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  function save() {
    if (cancelled || !editing.value) return
    const value = draft.value.trim()
    editing.value = false
    if (value !== props.focus) emit('update:focus', value)
  }

  function cancel() {
    cancelled = true
    editing.value = false
  }

  function clearFocus() {
    emit('update:focus', '')
  }
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Progress
      </CardTitle>
      <CardDescription class="mt-0.5 text-xs text-subline">
        A quiet check-in with your goals.
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <div class="space-y-4">
        <div v-if="hasTime" class="space-y-2">
          <div class="flex items-baseline justify-between gap-3 text-xs">
            <span class="text-text-muted">Time elapsed</span>
            <span class="shrink-0 font-mono text-text-muted">Week {{ currentWeek }}/{{ totalWeeks }}</span>
          </div>
          <Progress
            :model-value="timePercent"
            class="h-2 bg-soft **:data-[slot=progress-indicator]:bg-ink"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-baseline justify-between gap-3 text-xs">
            <span class="text-text-strong">Tasks done</span>
            <span class="shrink-0 font-mono text-subline">{{ completed }}/{{ total }} · {{ taskPercent }}%</span>
          </div>
          <Progress
            :model-value="taskPercent"
            class="h-2 bg-soft **:data-[slot=progress-indicator]:bg-ink"
          />
        </div>

        <p v-if="pace" class="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span :class="pace.dot" class="size-1.5 rounded-full" />
          {{ pace.label }}
        </p>
      </div>

      <div class="space-y-2.5">
        <p class="text-[11px] uppercase tracking-[0.15em] text-text-muted">
          Status
        </p>
        <TooltipProvider :delay-duration="100">
          <div class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-soft">
            <template v-for="segment in segments" :key="segment.key">
              <Tooltip v-if="segment.count > 0">
                <TooltipTrigger as-child>
                  <div
                    :class="segment.class"
                    class="h-full transition-all"
                    :style="{ flexGrow: segment.count }"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {{ segment.label }}: {{ segment.count }}
                </TooltipContent>
              </Tooltip>
            </template>
          </div>
        </TooltipProvider>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-subline">
          <span v-for="segment in segments" :key="segment.key" class="flex items-center gap-1.5">
            <span :class="segment.class" class="size-1.5 shrink-0 rounded-full" />
            {{ segment.label }}
            <span class="font-mono text-text-strong">{{ segment.count }}</span>
          </span>
        </div>
      </div>

      <div class="border-t border-line pt-5">
        <p class="text-[11px] uppercase tracking-[0.15em] text-text-muted">
          This Week
        </p>

        <div v-if="editing" class="mt-2 space-y-1.5">
          <Textarea
            ref="inputEl"
            v-model="draft"
            :maxlength="MAX_FOCUS"
            rows="2"
            class="resize-none text-sm"
            placeholder="What's the one thing that matters most this week?"
            @keydown.enter.exact.prevent="save"
            @keydown.esc.prevent="cancel"
            @blur="save"
          />
          <p class="flex items-center justify-between text-[11px] text-text-muted">
            <span class="hidden md:inline">Enter to save · Esc to cancel</span>
            <span class="md:hidden">Tap outside to save</span>
            <span class="font-mono">{{ draft.length }}/{{ MAX_FOCUS }}</span>
          </p>
        </div>

        <div v-else-if="focus" class="group mt-2">
          <button
            type="button"
            class="text-left text-sm leading-relaxed text-text-strong transition-colors hover:text-ink"
            @click="startEdit"
          >
            {{ focus }}
          </button>
          <div class="mt-1 flex gap-4 text-[11px] text-text-muted transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <button type="button" class="py-1.5 underline-offset-4 hover:text-ink hover:underline" @click="startEdit">
              Edit
            </button>
            <button type="button" class="py-1.5 underline-offset-4 hover:text-ink hover:underline" @click="clearFocus">
              Clear
            </button>
          </div>
        </div>

        <p v-else class="mt-2 text-sm leading-relaxed text-text-muted">
          What's the one thing that matters most this week?
        </p>

        <p
          v-if="nextDeadline"
          class="mt-3 flex items-center gap-2 text-xs text-subline"
        >
          <CalendarClock class="size-3.5 shrink-0 text-text-muted" />
          <span class="truncate">{{ nextDeadline.title }}</span>
          <span class="shrink-0 font-mono text-urgency-due">· Due in {{ nextDeadline.dueIn }}</span>
        </p>

        <Button
          v-if="!focus && !editing"
          variant="link"
          class="mt-3 h-auto gap-1.5 p-0 py-1 text-xs font-semibold text-text-strong underline underline-offset-4"
          @click="startEdit"
        >
          Add a note
          <Plus class="size-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>