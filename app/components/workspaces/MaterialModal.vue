<script setup lang="ts">
  import { ChevronDown, X } from '@lucide/vue'
  import { useMediaQuery } from '@vueuse/core'
  import { computed, nextTick, ref, watch } from 'vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { Textarea } from '@/components/ui/textarea'

  const materialTypes = ['Notes', 'Book', 'Slides', 'Collection', 'Link', 'PDF', 'Video'] as const
  type MaterialType = typeof materialTypes[number]

  interface MaterialPayload {
    title: string
    course: string
    type: MaterialType
    url: string
    tags: string[]
    description: string
    taskId: number | null
  }

  const props = defineProps<{
    open: boolean
    courses?: string[]
    tasks?: { id: number, task: string, course: string }[]
  }>()

  const emit = defineEmits<{
    close: []
    submit: [payload: MaterialPayload, addAnother: boolean]
  }>()

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const Root = computed(() => (isDesktop.value ? Dialog : Drawer))
  const Content = computed(() => (isDesktop.value ? DialogContent : DrawerContent))
  const Header = computed(() => (isDesktop.value ? DialogHeader : DrawerHeader))
  const Title = computed(() => (isDesktop.value ? DialogTitle : DrawerTitle))
  const Description = computed(() => (isDesktop.value ? DialogDescription : DrawerDescription))

  const NEW_COURSE = '__new__'
  const NO_TASK = '__none__'
  const DEFAULT_TYPE: MaterialType = 'Notes'

  const title = ref('')
  const course = ref('')
  const addingCourse = ref(false)
  const type = ref<MaterialType>(DEFAULT_TYPE)
  const typeTouched = ref(false)
  const url = ref('')
  const tags = ref<string[]>([])
  const tagInput = ref('')
  const description = ref('')
  const linkedTask = ref<number | null>(null)
  const showMore = ref(false)
  const titleEl = ref<InstanceType<typeof Input> | null>(null)

  const showCourseInput = computed(() => !props.courses?.length || addingCourse.value)
  const canSubmit = computed(() => !!title.value.trim() && !!course.value.trim())

  const taskOptions = computed(() =>
    [...(props.tasks ?? [])].sort((a, b) => Number(b.course === course.value) - Number(a.course === course.value)),
  )

  function onTaskSelect(value: unknown) {
    linkedTask.value = !value || value === NO_TASK ? null : Number(value)
  }

  function reset() {
    title.value = ''
    course.value = ''
    addingCourse.value = false
    type.value = DEFAULT_TYPE
    typeTouched.value = false
    url.value = ''
    tags.value = []
    tagInput.value = ''
    description.value = ''
    linkedTask.value = null
    showMore.value = false
  }

  watch(() => props.open, (isOpen) => {
    if (isOpen)
      reset()
  })

  function focusTitle() {
    nextTick(() => (titleEl.value?.$el as HTMLInputElement | undefined)?.focus())
  }

  function onOpenAutoFocus() {
    if (isDesktop.value)
      focusTitle()
  }

  function onOpenChange(value: boolean) {
    if (!value)
      emit('close')
  }

  function parseUrl(raw: string): URL | null {
    const value = raw.trim()
    if (!value)
      return null
    try {
      return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`)
    }
    catch {
      return null
    }
  }

  function detectType(parsed: URL): MaterialType {
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname.toLowerCase()
    if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host))
      return 'Video'
    if (path.endsWith('.pdf'))
      return 'PDF'
    if (path.endsWith('.ppt') || path.endsWith('.pptx') || (host === 'docs.google.com' && path.startsWith('/presentation')))
      return 'Slides'
    return 'Link'
  }

  watch(url, (value) => {
    if (typeTouched.value)
      return
    const parsed = parseUrl(value)
    if (parsed)
      type.value = detectType(parsed)
    else if (!value.trim())
      type.value = DEFAULT_TYPE
  })

  function onUrlBlur() {
    if (title.value.trim())
      return
    const parsed = parseUrl(url.value)
    if (!parsed)
      return
    const file = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '')
    const fromFile = file.replace(/\.[a-z\d]{2,4}$/i, '').replace(/[-_]+/g, ' ').trim()
    title.value = fromFile || parsed.hostname.replace(/^www\./, '')
  }

  function onTypeChange(value: unknown) {
    if (!value)
      return
    type.value = value as MaterialType
    typeTouched.value = true
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
    const parsed = parseUrl(url.value)
    emit('submit', {
      title: title.value.trim(),
      course: course.value.trim(),
      type: type.value,
      url: parsed ? parsed.toString() : '',
      tags: [...tags.value],
      description: description.value.trim(),
      taskId: linkedTask.value,
    }, addAnother)
    if (addAnother) {
      title.value = ''
      type.value = DEFAULT_TYPE
      typeTouched.value = false
      url.value = ''
      tags.value = []
      tagInput.value = ''
      description.value = ''
      linkedTask.value = null
      if (isDesktop.value)
        focusTitle()
    }
  }
</script>

<template>
  <component :is="Root" :open="open" @update:open="onOpenChange">
    <component
      :is="Content"
      :class="isDesktop && 'flex max-h-[90vh] max-w-md flex-col'"
      @open-auto-focus.prevent="onOpenAutoFocus"
    >
      <component :is="Header" class="text-left">
        <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          New material
        </p>
        <component :is="Title" class="text-base">
          Add it to your library.
        </component>
        <component :is="Description" class="sr-only">
          Tambahkan materi kuliah baru ke workspace aktif.
        </component>
      </component>

      <div :class="isDesktop ? '-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-1' : 'max-h-[75vh] overflow-y-auto px-4 pb-6'">
        <form
          class="space-y-6"
          @submit.prevent="handleSubmit(false)"
          @keydown.ctrl.enter.prevent="handleSubmit(false)"
          @keydown.meta.enter.prevent="handleSubmit(false)"
        >
          <div class="space-y-4">
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
              <Label for="material-url" class="text-xs">Link <span class="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                id="material-url"
                v-model="url"
                type="url"
                inputmode="url"
                class="text-sm"
                placeholder="https://drive.google.com/…"
                @blur="onUrlBlur"
              />
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
            </div>

            <Collapsible v-model:open="showMore">
              <CollapsibleTrigger as-child>
                <Button type="button" variant="ghost" size="sm" class="-ml-2 gap-1 text-xs text-muted-foreground">
                  More options
                  <ChevronDown class="size-3.5 transition-transform" :class="showMore && 'rotate-180'" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent class="mt-2 space-y-4">
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

                <div class="space-y-2">
                  <Label for="material-notes" class="text-xs">Notes <span class="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea
                    id="material-notes"
                    v-model="description"
                    rows="3"
                    class="resize-none text-sm"
                    placeholder="Halaman yang perlu dibaca, poin penting, dll."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" :disabled="!canSubmit" @click="handleSubmit(true)">
              Create & add another
            </Button>
            <div class="flex gap-2">
              <Button type="button" variant="outline" class="flex-1 sm:flex-none" @click="emit('close')">
                Cancel
              </Button>
              <Button type="submit" class="flex-1 sm:flex-none" :disabled="!canSubmit">
                Add material
              </Button>
            </div>
          </div>
        </form>
      </div>
    </component>
  </component>
</template>