<script setup lang="ts">
  import { ChevronDown, X } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import type { MaterialPayload, MaterialType } from '~/types'
  import { MATERIAL_TYPE_DESCRIPTIONS, normalizeUrl } from '~/utils/materialContent'

  const props = defineProps<{
    courses?: string[]
    tasks?: { id: number, task: string, course: string }[]
    autofocus?: boolean
    initial?: MaterialPayload | null
    submitLabel?: string
  }>()

  const emit = defineEmits<{
    cancel: []
    submit: [payload: MaterialPayload, addAnother: boolean]
  }>()

  const materialTypes: MaterialType[] = ['Notes', 'Book', 'Slides', 'Collection', 'Link', 'PDF', 'Video']

  const NEW_COURSE = '__new__'
  const NO_TASK = '__none__'
  const DEFAULT_TYPE: MaterialType = 'Notes'

  const title = ref('')
  const course = ref('')
  const addingCourse = ref(false)
  const type = ref<MaterialType>(DEFAULT_TYPE)
  const url = ref('')
  const urlError = ref<string | null>(null)
  const tags = ref<string[]>([])
  const tagInput = ref('')
  const linkedTask = ref<number | null>(null)
  const showMore = ref(false)
  const titleEl = ref<InstanceType<typeof Input> | null>(null)

  const showCourseInput = computed(() => !props.courses?.length || addingCourse.value)
  const showUrl = computed(() => !props.initial && (type.value === 'Link' || type.value === 'Video'))
  const canSubmit = computed(() => !!title.value.trim() && !!course.value.trim())

  const taskOptions = computed(() =>
    [...(props.tasks ?? [])].sort((a, b) => Number(b.course === course.value) - Number(a.course === course.value)),
  )

  function applyInitial() {
    const init = props.initial
    if (!init)
      return
    title.value = init.title
    course.value = init.course
    type.value = init.type
    url.value = init.url
    urlError.value = null
    tags.value = [...init.tags]
    tagInput.value = ''
    linkedTask.value = init.taskId
  }

  watch(() => props.initial, applyInitial)

  function focusTitle() {
    nextTick(() => (titleEl.value?.$el as HTMLInputElement | undefined)?.focus())
  }

  onMounted(() => {
    applyInitial()
    if (props.autofocus)
      focusTitle()
  })

  function onUrlBlur() {
    urlError.value = null
    const raw = url.value.trim()
    if (!raw)
      return
    const result = normalizeUrl(raw)
    if ('error' in result) {
      urlError.value = result.error
      return
    }
    url.value = result.url
    if (title.value.trim())
      return
    const parsed = new URL(result.url)
    const file = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '')
    const fromFile = file.replace(/\.[a-z\d]{2,4}$/i, '').replace(/[-_]+/g, ' ').trim()
    title.value = fromFile || parsed.hostname.replace(/^www\./, '')
  }

  function onTypeChange(value: unknown) {
    if (!value)
      return
    type.value = value as MaterialType
    if (type.value !== 'Link' && type.value !== 'Video') {
      url.value = ''
      urlError.value = null
    }
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

  function onTaskSelect(value: unknown) {
    linkedTask.value = !value || value === NO_TASK ? null : Number(value)
  }

  function commitTag() {
    const value = tagInput.value.trim().replace(/,$/, '').trim()
    tagInput.value = ''
    if (!value)
      return
    if (!tags.value.some(t => t.toLowerCase() === value.toLowerCase()))
      tags.value.push(value)
  }

  function removeTag(tag: string) {
    tags.value = tags.value.filter(t => t !== tag)
  }

  function onTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag()
    }
    else if (e.key === 'Backspace' && !tagInput.value && tags.value.length) {
      tags.value.pop()
    }
  }

  function handleSubmit(addAnother = false) {
    if (!canSubmit.value)
      return
    commitTag()
    let nextUrl = ''
    if (showUrl.value && url.value.trim()) {
      const result = normalizeUrl(url.value)
      if ('error' in result) {
        urlError.value = result.error
        return
      }
      nextUrl = result.url
    }
    emit('submit', {
      title: title.value.trim(),
      course: course.value.trim(),
      type: type.value,
      url: nextUrl,
      tags: [...tags.value],
      taskId: linkedTask.value,
    }, addAnother)
    if (addAnother) {
      title.value = ''
      type.value = DEFAULT_TYPE
      url.value = ''
      urlError.value = null
      tags.value = []
      tagInput.value = ''
      linkedTask.value = null
      if (props.autofocus)
        focusTitle()
    }
  }
</script>

<template>
  <form
    class="space-y-7"
    @submit.prevent="handleSubmit(false)"
    @keydown.ctrl.enter.prevent="handleSubmit(false)"
    @keydown.meta.enter.prevent="handleSubmit(false)"
  >
    <div class="space-y-5">
      <div class="space-y-2">
        <Label for="material-title" class="text-xs">Title</Label>
        <Input
          id="material-title"
          ref="titleEl"
          v-model="title"
          class="text-sm"
          placeholder="e.g. Week 04 — Synthesis methods"
        />
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
        <Label class="text-xs">Type</Label>
        <Select :model-value="type" @update:model-value="onTypeChange">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="t in materialTypes" :key="t" :value="t">
              {{ t }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-xs text-muted-foreground">
          {{ MATERIAL_TYPE_DESCRIPTIONS[type] }}
        </p>
      </div>

      <div v-if="showUrl" class="space-y-2">
        <Label for="material-url" class="text-xs">
          {{ type === 'Video' ? 'Video link' : 'Link' }}
          <span class="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="material-url"
          v-model="url"
          type="url"
          inputmode="url"
          class="text-sm"
          placeholder="https://…"
          :aria-invalid="!!urlError"
          @input="urlError = null"
          @blur="onUrlBlur"
        />
        <p v-if="urlError" class="text-xs text-destructive">
          {{ urlError }}
        </p>
        <p v-else class="text-xs text-muted-foreground">
          {{ type === 'Video' ? 'Opens in a new tab. You can upload a file instead.' : 'Opens in a new tab.' }}
        </p>
      </div>

      <Collapsible v-model:open="showMore">
        <CollapsibleTrigger as-child>
          <Button type="button" variant="ghost" size="sm" class="-ml-2 gap-1 text-xs text-muted-foreground">
            More options
            <ChevronDown class="size-3.5 transition-transform" :class="showMore && 'rotate-180'" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-2 space-y-5">
          <div v-if="tasks?.length" class="space-y-2">
            <Label class="text-xs">Linked task <span class="font-normal text-muted-foreground">(optional)</span></Label>
            <Select
              :model-value="linkedTask === null ? NO_TASK : String(linkedTask)"
              @update:model-value="onTaskSelect"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="No linked task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="NO_TASK">
                  No linked task
                </SelectItem>
                <SelectItem v-for="t in taskOptions" :key="t.id" :value="String(t.id)">
                  {{ t.task }}
                  <span class="text-muted-foreground">· {{ t.course }}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="material-tags" class="text-xs">Tags <span class="font-normal text-muted-foreground">(Enter atau koma)</span></Label>
            <div class="flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <Badge v-for="t in tags" :key="t" variant="secondary" class="gap-1 pr-1">
                {{ t }}
                <button
                  type="button"
                  class="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                  :aria-label="`Remove ${t}`"
                  @click="removeTag(t)"
                >
                  <X class="size-3" />
                </button>
              </Badge>
              <Input
                id="material-tags"
                v-model="tagInput"
                class="h-7 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                placeholder="reading, theory"
                @keydown="onTagKeydown"
                @blur="commitTag"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

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
          {{ props.submitLabel ?? 'Add material' }}
        </Button>
      </div>
    </div>
  </form>
</template>