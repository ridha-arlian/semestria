<script setup lang="ts">
import { Check, Pencil, Trash2 } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import MaterialForm from '~/components/workspaces/modal/MaterialForm.vue'
import type { BreadcrumbEntry, MaterialPayload } from '~/types'
import type { Ref } from 'vue'
import type { MaterialDetailContext } from '~/components/workspaces/material-detail/materialDetailContext.ts'
import { planTypeChange } from '~/utils/materialContent'

definePageMeta({
  layout: 'workspaces',
  middleware: 'workspace',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const listPath = computed(() => `/workspaces/${slug.value}/materials`)

const ctx = inject<MaterialDetailContext>('workspace')!
const breadcrumbExtra = inject<Ref<BreadcrumbEntry[]> | undefined>('breadcrumbExtra')
const isDesktop = useMediaQuery('(min-width: 768px)')

const material = computed(() => ctx.materials.value.find(m => m.id === Number(route.params.id)))

if (!material.value)
  throw createError({ statusCode: 404, statusMessage: 'Material not found' })

watch(() => material.value?.title, (title) => {
  if (breadcrumbExtra)
    breadcrumbExtra.value = title ? [{ label: title }] : []
}, { immediate: true })

onUnmounted(() => {
  if (breadcrumbExtra)
    breadcrumbExtra.value = []
  if (justReviewedTimer)
    clearTimeout(justReviewedTimer)
})

const courses = computed(() => [...new Set([...ctx.tasks.value, ...ctx.materials.value].map(i => i.course))])

const editOpen = ref(false)
const editInitial = computed<MaterialPayload | null>(() => {
  const m = material.value
  if (!m)
    return null
  return {
    title: m.title,
    course: m.course,
    type: m.type,
    url: m.url ?? '',
    tags: m.tags.split(',').map(t => t.trim()).filter(Boolean),
    taskId: m.taskId ?? null,
  }
})

const typeChangeOpen = ref(false)
const pendingEdit = ref<MaterialPayload | null>(null)

function handleEditSubmit(payload: MaterialPayload) {
  const item = material.value
  if (!item)
    return
  if (payload.type !== item.type && planTypeChange(item, payload.type).lost) {
    pendingEdit.value = payload
    typeChangeOpen.value = true
    return
  }
  applyEdit(payload)
}

function applyEdit(payload: MaterialPayload) {
  if (!material.value)
    return
  ctx.updateMaterial(material.value.id, payload)
  editOpen.value = false
  pendingEdit.value = null
}

function confirmTypeChange() {
  if (pendingEdit.value)
    applyEdit(pendingEdit.value)
}

const justReviewed = ref(false)
let justReviewedTimer: ReturnType<typeof setTimeout> | undefined

type ReviewState = 'none' | 'stale' | 'fresh'

function reviewedAgeDays(reviewed: string): number | null {
  const v = reviewed.trim().toLowerCase()
  if (!v)
    return null
  if (v === 'just now')
    return 0
  if (v === 'yesterday')
    return 1
  const match = v.match(/^([a-z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{4}))?$/)
  if (!match)
    return 0
  const now = new Date()
  const year = match[3] ? Number(match[3]) : now.getFullYear()
  const parsed = new Date(`${match[1]} ${match[2]}, ${year}`)
  if (Number.isNaN(parsed.getTime()))
    return 0
  if (!match[3] && parsed.getTime() > now.getTime())
    parsed.setFullYear(year - 1)
  return Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24))
}

const reviewState = computed<ReviewState>(() => {
  const age = reviewedAgeDays(material.value?.reviewed ?? '')
  if (age === null)
    return 'none'
  return age > 7 ? 'stale' : 'fresh'
})

function handleMarkReviewed() {
  if (!material.value)
    return
  ctx.markMaterialReviewed(material.value.id)
  justReviewed.value = true
  if (justReviewedTimer)
    clearTimeout(justReviewedTimer)
  justReviewedTimer = setTimeout(() => {
    justReviewed.value = false
  }, 2000)
}

const deleteOpen = ref(false)

function handleDelete() {
  if (!material.value)
    return
  ctx.removeMaterial(material.value.id)
  navigateTo(listPath.value)
}
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div v-if="material" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-headline">
            {{ material.title }}
          </h1>
          <p class="mt-1.5 truncate text-sm text-subline">
            {{ material.course }}
          </p>
          <p v-if="reviewState === 'none'" class="mt-1 flex items-center gap-1.5 text-xs text-subline">
            <span class="size-1.5 shrink-0 rounded-full bg-text-muted" />
            Not reviewed yet
          </p>
          <p v-else-if="reviewState === 'stale'" class="mt-1 flex items-center gap-1.5 text-xs text-subline">
            <span class="size-1.5 shrink-0 rounded-full bg-urgency-due" />
            Need review
          </p>
        </div>
        <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
          <Button size="sm" variant="outline" class="w-full sm:w-auto" @click="editOpen = true">
            <Pencil class="mr-2 size-3.5" />
            <span>Edit</span>
          </Button>
          <Button size="sm" class="w-full sm:w-auto" :disabled="justReviewed" @click="handleMarkReviewed">
            <Check class="mr-2 size-3.5" />
            <span>{{ justReviewed ? 'Reviewed' : 'Mark reviewed' }}</span>
          </Button>
        </div>
      </div>

      <!-- Two columns -->
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <WorkspacesMaterialDetailMaterialContent :material="material" class="lg:col-span-2" />
        <div class="space-y-6">
          <WorkspacesMaterialDetailMaterialDetails :material="material" />
          <WorkspacesMaterialDetailMaterialRelatedTasks :material="material" />
          <WorkspacesMaterialDetailMaterialActivity :material="material" />
        </div>
      </div>

      <!-- Footer -->
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
    </div>

    <!-- Edit dialog / drawer -->
    <Dialog v-if="isDesktop" :open="editOpen" @update:open="(v: boolean) => { if (!v) editOpen = false }">
      <DialogContent class="flex max-h-[90vh] max-w-md flex-col" @open-auto-focus.prevent>
        <DialogHeader>
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Edit material
          </p>
          <DialogTitle class="text-base">
            Keep it up to date.
          </DialogTitle>
          <DialogDescription class="sr-only">
            Edit this material.
          </DialogDescription>
        </DialogHeader>
        <div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-1">
          <MaterialForm
            v-if="editOpen && editInitial"
            :courses="courses"
            :tasks="ctx.tasks.value"
            :initial="editInitial"
            submit-label="Save changes"
            autofocus
            @cancel="editOpen = false"
            @submit="handleEditSubmit"
          />
        </div>
      </DialogContent>
    </Dialog>

    <Drawer v-else :open="editOpen" @update:open="(v: boolean) => { if (!v) editOpen = false }">
      <DrawerContent @open-auto-focus.prevent>
        <DrawerHeader class="text-left">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Edit material
          </p>
          <DrawerTitle class="text-base">
            Keep it up to date.
          </DrawerTitle>
          <DrawerDescription class="sr-only">
            Edit this material.
          </DrawerDescription>
        </DrawerHeader>
        <div class="max-h-[75vh] overflow-y-auto px-4 pb-6">
          <MaterialForm
            v-if="editOpen && editInitial"
            :courses="courses"
            :tasks="ctx.tasks.value"
            :initial="editInitial"
            submit-label="Save changes"
            @cancel="editOpen = false"
            @submit="handleEditSubmit"
          />
        </div>
      </DrawerContent>
    </Drawer>

    <ConfirmDialog
      v-model:open="typeChangeOpen"
      title="Change material type?"
      confirm-label="Change type"
      @confirm="confirmTypeChange"
      @close="pendingEdit = null"
    >
      <template #description>
        Switching to {{ pendingEdit?.type }} will remove content that doesn't fit the new type. Notes, tags, and linked tasks are kept.
      </template>
    </ConfirmDialog>

    <!-- Delete confirm -->
    <DeleteConfirmDialog
      v-model:open="deleteOpen"
      title="Delete this material?"
      confirm-label="Delete material"
      @confirm="handleDelete"
    >
      <template #description>
        Are you sure you want to delete <strong class="font-semibold text-destructive">"{{ material?.title }}"</strong>? This action can't be undone. Linked tasks will be kept, but the link to this material will be removed.
      </template>
    </DeleteConfirmDialog>
  </main>
</template>
