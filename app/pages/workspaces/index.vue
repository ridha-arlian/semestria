<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed, ref } from 'vue'
import AddItemModal from '~/components/dashboard/AddItemModal.vue'
import AppHeader from '~/components/dashboard/AppHeader.vue'
import AppSidebar from '~/components/dashboard/AppSidebar.vue'
import AssignmentsView from '~/components/dashboard/AssignmentsView.vue'
import MaterialsView from '~/components/dashboard/MaterialsView.vue'
import OverviewStats from '~/components/dashboard/OverviewStats.vue'
import SemesterProgress from '~/components/dashboard/SemesterProgress.vue'
import UpcomingAssignments from '~/components/dashboard/UpcomingAssignments.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { Assignment, ModalType, Material, View } from '~/types/dashboard'

const view = ref<View>('Overview')
const mobileNav = ref(false)
const showModal = ref(false)
const modalType = ref<ModalType>('assignment')

const assignments = ref<Assignment[]>([
  { id: 1, task: 'Research proposal', course: 'Design Research', due: 'Sep 12, 2026', status: 'In progress', priority: 'High', progress: 65 },
  { id: 2, task: 'Midterm reflection essay', course: 'Cultural Studies', due: 'Sep 15, 2026', status: 'Not started', priority: 'Medium', progress: 0 },
  { id: 3, task: 'Prototype v2 presentation', course: 'Interaction Design', due: 'Sep 18, 2026', status: 'In progress', priority: 'High', progress: 40 },
  { id: 4, task: 'Reading response #04', course: 'Design Research', due: 'Sep 20, 2026', status: 'Not started', priority: 'Low', progress: 0 },
  { id: 5, task: 'Group critique notes', course: 'Studio Practice', due: 'Sep 22, 2026', status: 'Done', priority: 'Medium', progress: 100 },
])

const materials = ref<Material[]>([
  { id: 1, title: 'The Design of Everyday Things', course: 'Interaction Design', type: 'Book', tags: 'reading, theory', reviewed: 'Yesterday' },
  { id: 2, title: 'Week 03 — Research methods', course: 'Design Research', type: 'Slides', tags: 'methods, week 03', reviewed: 'Sep 08' },
  { id: 3, title: 'Studio references / 2026', course: 'Studio Practice', type: 'Collection', tags: 'references', reviewed: 'Sep 05' },
  { id: 4, title: 'Cultural identity notes', course: 'Cultural Studies', type: 'Notes', tags: 'identity, key terms', reviewed: 'Aug 29' },
])

const completed = computed(() => assignments.value.filter(a => a.status === 'Done').length)

function openAdd(type: ModalType) {
  modalType.value = type
  showModal.value = true
}

function handleSubmit(payload: { task: string, course: string, due: string }) {
  if (modalType.value === 'assignment') {
    assignments.value.unshift({
      id: Date.now(),
      task: payload.task,
      course: payload.course,
      due: payload.due || 'No due date',
      status: 'Not started',
      priority: 'Medium',
      progress: 0,
    })
  }
  else {
    materials.value.unshift({
      id: Date.now(),
      title: payload.task,
      course: payload.course,
      type: 'Note',
      tags: 'new',
      reviewed: 'Just now',
    })
  }
  showModal.value = false
}

function cycleStatus(item: Assignment) {
  item.status = item.status === 'Not started' ? 'In progress' : item.status === 'In progress' ? 'Done' : 'Not started'
  item.progress = item.status === 'Done' ? 100 : item.status === 'In progress' ? 50 : 0
}

function removeAssignment(id: number) {
  assignments.value = assignments.value.filter(a => a.id !== id)
}
</script>

<template>
  <SidebarProvider>
    <div class="min-h-screen w-full bg-paper text-neutral-900 flex">
      <AppSidebar
        :view="view"
        :assignments-count="assignments.length"
        @update:view="view = $event"
      />

      <SidebarInset class="flex flex-1 flex-col">
        <AppHeader
          :view="view"
          @toggle-mobile-nav="mobileNav = !mobileNav"
          @add="openAdd(view === 'Materials' ? 'material' : 'assignment')"
        />

        <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
          <div class="animate-rise">
            <div v-if="view === 'Overview'" class="space-y-8">
              <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <p class="text-sm text-neutral-500">
                  Here's what's happening across your semester.
                </p>
                <button
                  class="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-700"
                  @click="openAdd('assignment')"
                >
                  <Plus class="size-3.5" />
                  Add assignment
                </button>
              </div>

              <OverviewStats :assignments="assignments" :completed="completed" />

              <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <UpcomingAssignments :assignments="assignments" @view-all="view = 'Assignments'" />
                <SemesterProgress
                  :completed="completed"
                  :total="assignments.length"
                  @add-material="openAdd('material')"
                />
              </div>
            </div>

            <AssignmentsView
              v-else-if="view === 'Assignments'"
              :assignments="assignments"
              @add="openAdd('assignment')"
              @toggle-status="cycleStatus"
              @remove="removeAssignment"
            />

            <MaterialsView
              v-else
              :materials="materials"
              @add="openAdd('material')"
            />
          </div>
        </main>
      </SidebarInset>

      <AddItemModal
        :open="showModal"
        :modal-type="modalType"
        @close="showModal = false"
        @submit="handleSubmit"
      />
    </div>
  </SidebarProvider>
</template>