<script setup lang="ts">
import { Check, CheckCircle2, Pencil, Trash2 } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import MaterialForm from '~/components/workspaces/modal/MaterialForm.vue'
import type { BreadcrumbEntry, MaterialPayload } from '~/types'
import type { Ref } from 'vue'
import type { MaterialDetailContext } from '~/components/workspaces/material-detail/materialDetailContext.ts'

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
    description: m.description ?? '',
    taskId: m.taskId ?? null,
  }
})

function handleEditSubmit(payload: MaterialPayload) {
  if (!material.value)
    return
  ctx.updateMaterial(material.value.id, payload)
  editOpen.value = false
}

const justReviewed = ref(false)
let justReviewedTimer: ReturnType<typeof setTimeout> | undefined

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
const deleteFromDrive = ref(false)

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
          <p class="mt-1 flex items-center gap-1.5 text-xs text-subline">
            <CheckCircle2 class="size-3.5 text-status-done" />
            Reviewed {{ material.reviewed }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <Button size="sm" variant="outline" aria-label="Edit material" @click="editOpen = true">
            <Pencil class="size-3.5 sm:mr-2" />
            <span class="max-sm:hidden">Edit</span>
          </Button>
          <Button size="sm" :disabled="justReviewed" @click="handleMarkReviewed">
            <Check class="size-3.5 sm:mr-2" />
            <span class="max-sm:hidden">{{ justReviewed ? 'Reviewed' : 'Mark reviewed' }}</span>
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
      <Separator />
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-subline">
          Delete this material. This can't be undone.
        </p>
        <Button
          variant="outline"
          class="w-full text-destructive hover:text-destructive sm:w-auto"
          @click="deleteOpen = true"
        >
          <Trash2 class="mr-2 size-3.5" />
          Delete material
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

    <!-- Delete confirm -->
    <DeleteConfirmDialog
      v-model:open="deleteOpen"
      title="Delete this material?"
      confirm-label="Delete material"
      @confirm="handleDelete"
      @close="deleteFromDrive = false"
    >
      <template #description>
        Are you sure you want to delete <strong class="font-semibold text-destructive">"{{ material?.title }}"</strong>? This action can't be undone. Linked tasks will be kept, but the link to this material will be removed.
      </template>
      <template #extra>
        <label v-if="material?.url" class="flex cursor-pointer items-start gap-2.5 rounded-md border border-line px-3 py-2.5 text-left">
          <Checkbox v-model="deleteFromDrive" />
          <span class="text-xs leading-relaxed text-text-strong">
            Also delete the file from Google Drive
          </span>
        </label>
      </template>
    </DeleteConfirmDialog>
  </main>
</template>
