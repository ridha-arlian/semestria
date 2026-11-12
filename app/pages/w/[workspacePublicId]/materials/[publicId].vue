<script setup lang="ts">
import { Check, Pencil, Trash2 } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import MaterialForm from '~/components/workspaces/modal/MaterialForm.vue'
import type { BreadcrumbEntry, MaterialPayload, MaterialType } from '~/types'
import type { Ref } from 'vue'
import type { MaterialDetailContext } from '~/components/workspaces/material-detail/materialDetailContext.ts'
import { planTypeChange } from '~/utils/materialContent'
import { DEMO_MATERIAL_TYPES } from '~~/shared/demo'

definePageMeta({
  layout: 'workspaces',
  middleware: 'workspace',
})

const route = useRoute()
const workspacePublicId = computed(() => route.params.workspacePublicId as string)
const listPath = computed(() => `/w/${workspacePublicId.value}/materials`)

const ctx = inject<MaterialDetailContext>('workspace')!
const breadcrumbExtra = inject<Ref<BreadcrumbEntry[]> | undefined>('breadcrumbExtra')
const isDesktop = useMediaQuery('(min-width: 768px)')
const { isDemo } = useDemo()
const allowedMaterialTypes = computed<MaterialType[] | undefined>(() =>
  isDemo.value ? [...DEMO_MATERIAL_TYPES] : undefined,
)

const material = computed(() => ctx.materials.value.find(m => m.publicId === route.params.publicId))

const workspaceKey = computed(() => `workspace:${ctx.workspace.value?.id ?? 0}`)
const { ready, showSkeleton, error } = useDataStatus(workspaceKey)

// SSR always has the awaited data, so a missing material there is a real 404.
// On the client the cache may still be loading; wait for hydration before
// deciding, otherwise a valid deep link would 404 on a cold cache.
if (import.meta.server && !material.value) {
  throw createError({ statusCode: 404, statusMessage: 'Material not found' })
}

watch([material, ready], ([value, isReady]) => {
  if (!value && isReady) {
    showError({ statusCode: 404, statusMessage: 'Material not found' })
  }
}, { immediate: true })

function retryWorkspace() {
  void fetchWorkspaceData(workspacePublicId.value, { force: true })
}

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
  const item = material.value
  if (!item)
    return 'none'
  // Prefer the ISO timestamp: relative labels such as "3d ago" are display
  // text and cannot be parsed back into an age.
  const isoAge = item.reviewedAt ? Math.floor((Date.now() - new Date(item.reviewedAt).getTime()) / 86400000) : null
  const age = isoAge !== null && Number.isFinite(isoAge) ? isoAge : reviewedAgeDays(item.reviewed ?? '')
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
    <SkeletonsContentError
      v-if="error"
      :message="error"
      @retry="retryWorkspace"
    />

    <SkeletonsDetailSkeleton v-else-if="showSkeleton" />

    <div v-else-if="material" class="flex flex-col gap-6 content-fade-in">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
            {{ material.course }}
          </p>
          <h1 class="mt-2 truncate text-2xl font-bold tracking-tight text-headline">
            {{ material.title }}
          </h1>
          <p v-if="reviewState === 'none'" class="mt-1.5 flex items-center gap-1.5 text-xs text-subline">
            <span class="size-1.5 shrink-0 rounded-full bg-text-muted" />
            Not reviewed yet
          </p>
          <p v-else-if="reviewState === 'stale'" class="mt-1.5 flex items-center gap-1.5 text-xs text-subline">
            <span class="size-1.5 shrink-0 rounded-full bg-urgency-due" />
            Need review
          </p>
        </div>
        <div class="flex w-full shrink-0 items-center justify-between gap-1.5 sm:w-auto sm:justify-start">
          <Button size="sm" variant="outline" class="max-sm:order-last max-sm:w-8 max-sm:px-0" @click="editOpen = true">
            <Pencil class="mr-2 size-3.5 max-sm:mr-0" />
            <span class="max-sm:hidden">Edit</span>
          </Button>
          <Button size="sm" class="flex-1 sm:flex-none" :disabled="justReviewed" @click="handleMarkReviewed">
            <Check class="mr-2 size-3.5" />
            <span>{{ justReviewed ? 'Reviewed' : 'Mark reviewed' }}</span>
          </Button>
        </div>
      </div>

      <!-- Two columns -->
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <WorkspacesMaterialDetailMaterialContent :material="material" class="lg:col-span-2" />
        <div class="flex flex-col gap-6">
          <WorkspacesMaterialDetailMaterialDetails :material="material" />
          <WorkspacesMaterialDetailMaterialRelatedTasks :material="material" />
          <WorkspacesMaterialDetailMaterialActivity :material="material" />
        </div>
      </div>

      <!-- Footer -->
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
    </div>

    <!-- Edit dialog / drawer -->
    <Dialog v-if="isDesktop" :open="editOpen" @update:open="(v: boolean) => { if (!v) editOpen = false }">
      <DialogContent class="flex max-h-[90vh] max-w-md flex-col" @open-auto-focus.prevent>
        <DialogHeader>
          <DialogTitle class="text-base">
            Edit material
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
            :allowed-types="allowedMaterialTypes"
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
          <DrawerTitle class="text-base">
            Edit material
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
            :allowed-types="allowedMaterialTypes"
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
