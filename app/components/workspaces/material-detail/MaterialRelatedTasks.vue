<script setup lang="ts">
import { Check, Plus, X } from '@lucide/vue'
import type { Material, Task } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const linkedTasks = computed(() =>
  ctx.tasks.value.filter(t => t.id === props.material.taskId || t.materialIds?.includes(props.material.id)),
)

const linkedIds = computed(() => new Set(linkedTasks.value.map(t => t.id)))

/** Unlinked tasks first so the next pick is always at the top. */
const orderedTasks = computed(() =>
  [...ctx.tasks.value].sort((a, b) =>
    Number(linkedIds.value.has(a.id)) - Number(linkedIds.value.has(b.id))
    || a.course.localeCompare(b.course)
    || a.task.localeCompare(b.task),
  ),
)

const pickerOpen = ref(false)
const query = ref('')

/** Picks stay in a draft until "Done" so nothing is written while browsing. */
const draftIds = ref<Set<number>>(new Set())
const savedIds = ref<Set<number>>(new Set())

/**
 * Filtering happens here instead of in the combobox so the five-row limit is
 * applied to the matches the user is actually looking at.
 */
const MAX_VISIBLE = 5
const matches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle)
    return orderedTasks.value
  return orderedTasks.value.filter(t => `${t.task} ${t.course} ${t.status}`.toLowerCase().includes(needle))
})
const displayTasks = computed(() => matches.value.slice(0, MAX_VISIBLE))

/** The card itself only shows the first five linked tasks. */
const MAX_LINKED = 3
const visibleLinked = computed(() => linkedTasks.value.slice(0, MAX_LINKED))
const hiddenLinked = computed(() => linkedTasks.value.length - visibleLinked.value.length)

/** Combobox selection writes to the draft, never straight to the material. */
const selectedTasks = computed({
  get: () => orderedTasks.value.filter(t => draftIds.value.has(t.id)),
  set: (next: Task[]) => {
    draftIds.value = new Set(next.map(t => t.id))
  },
})

/** Writes the given snapshot to the material and records the activity. */
function commitDraft(drafted: Set<number>, saved: Set<number>) {
  for (const t of ctx.tasks.value) {
    if (drafted.has(t.id) && !saved.has(t.id))
      ctx.linkMaterialTask(props.material.id, t.id)
    else if (!drafted.has(t.id) && saved.has(t.id))
      ctx.unlinkMaterialTask(props.material.id, t.id)
  }
}

/**
 * Snapshot first, then let the panel finish closing before writing. The commit
 * flips the trigger between the dashed box and the "+" button, and that swap
 * moves the popper anchor — visible as a flick if the panel is still fading out.
 */
function applyDraft() {
  const drafted = new Set(draftIds.value)
  const saved = new Set(savedIds.value)
  closePicker()
  setTimeout(() => commitDraft(drafted, saved), 200)
}

/** Dismiss without writing anything. */
function closePicker() {
  pickerOpen.value = false
}

watch(pickerOpen, (open) => {
  if (open) {
    savedIds.value = new Set(linkedIds.value)
    draftIds.value = new Set(linkedIds.value)
  }
  else {
    query.value = ''
    // Escape and outside clicks dismiss: throw the draft away.
    draftIds.value = new Set(savedIds.value)
  }
})

watch(() => props.material.id, closePicker)
</script>

<template>
  <Combobox
    v-model="selectedTasks"
    v-model:open="pickerOpen"
    multiple
    by="id"
    ignore-filter
  >
    <Card class="overflow-hidden">
      <CardHeader class="border-b border-line">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <CardTitle class="text-sm font-semibold text-headline">
              Related tasks
            </CardTitle>
            <CardDescription class="mt-0.5 text-xs text-subline">
              Tasks linked to this material.
            </CardDescription>
          </div>

          <ComboboxAnchor
            v-if="linkedTasks.length > 0"
            as-child
            class="shrink-0"
          >
            <ComboboxTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-7 text-subline hover:text-ink"
                aria-label="Link task"
                title="Link task"
              >
                <Plus class="size-3.5" />
              </Button>
            </ComboboxTrigger>
          </ComboboxAnchor>
        </div>
      </CardHeader>
      <CardContent class="p-2">
        <div
          v-if="linkedTasks.length > 0"
          class="max-h-[9rem] space-y-0.5 overflow-y-auto overscroll-contain"
        >
          <div
            v-for="t in visibleLinked"
            :key="t.id"
            class="flex items-center gap-2.5 rounded-md px-2 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-text-strong">
                {{ t.task }}
              </p>
              <p class="truncate text-[11px] text-subline">
                {{ t.course }} · {{ t.status }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-subline transition-colors hover:text-ink"
              :aria-label="`Unlink ${t.task}`"
              :title="`Unlink ${t.task}`"
              @click="ctx.unlinkMaterialTask(material.id, t.id)"
            >
              <X class="size-3.5" />
            </button>
          </div>
        </div>

        <p
          v-if="hiddenLinked > 0"
          class="px-2 py-1.5 text-[11px] text-subline"
        >
          +{{ hiddenLinked }} more linked
        </p>

        <ComboboxAnchor
          v-if="linkedTasks.length === 0"
          as-child
          class="w-full"
        >
          <ComboboxTrigger as-child>
            <Button
              type="button"
              variant="outline"
              class="flex h-auto w-full flex-col items-center rounded-lg border border-dashed border-line bg-transparent px-4 py-3 text-center font-normal transition-colors hover:border-ink/30 hover:bg-soft/50"
            >
              <p class="text-sm font-medium text-text-strong">
                No tasks linked
              </p>
              <p class="mt-1 text-xs text-subline">
                <span class="underline underline-offset-2">Link task</span>
              </p>
            </Button>
          </ComboboxTrigger>
        </ComboboxAnchor>
      </CardContent>
    </Card>

    <ComboboxList align="start" :side-offset="4" class="w-72 p-0">
      <ComboboxInput
        v-model="query"
        placeholder="Search tasks…"
        class="h-9 rounded-none border-0 border-b border-line px-3 shadow-none focus-visible:ring-0"
      />
      <p
        v-if="matches.length === 0"
        class="px-3 py-6 text-center text-xs text-subline"
      >
        No tasks match.
      </p>
      <div v-else>
        <ComboboxGroup>
          <ComboboxItem
            v-for="t in displayTasks"
            :key="t.id"
            :value="t"
            :text-value="`${t.task} ${t.course} ${t.status}`"
            class="items-start gap-2.5 px-2 py-1.5"
          >
            <span
              class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line transition-colors"
              :class="draftIds.has(t.id) && 'border-ink bg-ink text-paper'"
            >
              <Check v-if="draftIds.has(t.id)" class="size-2.5!" />
            </span>
            <span class="min-w-0 flex-1">
              <span
                class="block truncate text-xs font-semibold text-text-strong"
                :class="draftIds.has(t.id) && 'text-text-muted'"
              >
                {{ t.task }}
              </span>
              <span class="block truncate text-[11px] text-subline">
                {{ t.course }} · {{ t.status }}
              </span>
            </span>
          </ComboboxItem>
        </ComboboxGroup>
      </div>
      <div class="border-t border-line px-2 py-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          class="h-8 w-full text-xs"
          @click="applyDraft"
        >
          Done
        </Button>
      </div>
    </ComboboxList>
  </Combobox>
</template>