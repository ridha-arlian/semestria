<script setup lang="ts">
  import { ref, provide } from 'vue'
  import { BookOpen, Check, LayoutDashboard, Plus, SquareCheck, FileText } from '@lucide/vue'
  import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
  import AddItemModal from '~/components/dashboard/AddItemModal.vue'
  import AppSidebar from '~/components/dashboard/AppSidebar.vue'
  import AppHeader from '~/components/dashboard/AppHeader.vue'
  import type { Assignment, ModalType, Material, View } from '~/types/dashboard'

  const view = ref<View>('Overview')
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

  function openAdd(type: ModalType) {
    modalType.value = type
    showModal.value = true
  }

  function cycleStatus(item: Assignment) {
    item.status = item.status === 'Not started' ? 'In progress' : item.status === 'In progress' ? 'Done' : 'Not started'
    item.progress = item.status === 'Done' ? 100 : item.status === 'In progress' ? 50 : 0
  }

  function removeAssignment(id: number) {
    assignments.value = assignments.value.filter(a => a.id !== id)
  }

  // Bagikan state & aksi ke page lewat provide/inject
  provide('workspace', {
    view,
    assignments,
    materials,
    openAdd,
    cycleStatus,
    removeAssignment,
  })

  const mainNavItems = [
    { name: 'Overview' as const, icon: LayoutDashboard },
    { name: 'Assignments' as const, icon: Check },
    { name: 'Materials' as const, icon: BookOpen },
  ]
  const collapseWrap = 'grid grid-cols-[1fr] transition-[grid-template-columns] duration-200 ease-linear group-data-[collapsible=icon]:grid-cols-[0fr]'
  const menuButtonClass = 'w-full justify-start gap-3 rounded-md px-3 py-2.5 text-[14px] transition-[padding,gap,color,background-color] duration-200 ease-linear text-neutral-500 hover:bg-white/70 hover:text-neutral-900 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto'
  const menuButtonActiveClass = 'data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-neutral-200'
</script>

<template>
  <SidebarProvider>
    <div class="min-h-screen w-full bg-paper text-neutral-900 flex">
      <AppSidebar>
        <SidebarGroup class="p-0">
          <div :class="collapseWrap">
            <SidebarGroupLabel class="overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 whitespace-nowrap">
              Workspace
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent class="mt-2 group-data-[collapsible=icon]:mt-0">
            <SidebarMenu class="space-y-1">
              <SidebarMenuItem v-for="item in mainNavItems" :key="item.name" class="flex justify-center overflow-hidden">
                <SidebarMenuButton
                  :is-active="view === item.name"
                  :tooltip="item.name"
                  :class="[menuButtonClass, menuButtonActiveClass]"
                  @click="view = item.name"
                >
                  <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.8" />

                  <div :class="collapseWrap">
                    <span class="overflow-hidden truncate whitespace-nowrap">
                      {{ item.name }}
                    </span>
                  </div>

                  <div v-if="item.name === 'Assignments'" class="ml-auto flex items-center transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                    <SidebarMenuBadge class="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-normal text-neutral-600">
                      {{ assignments.length }}
                    </SidebarMenuBadge>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup class="mt-4 p-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:select-none group-data-[collapsible=icon]:opacity-0">
          <SidebarGroupContent class="px-3">
            <Accordion type="single" collapsible default-value="semester" class="w-full">
              <AccordionItem value="semester" class="border-none">
                <AccordionTrigger class="h-auto py-0 flex items-center justify-start gap-1.5 hover:no-underline [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0 opacity-100 md:[&>svg]:opacity-0 md:hover:[&>svg]:opacity-100">
                  <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 hover:text-neutral-600 transition-colors">
                    This semester
                  </SidebarGroupLabel>
                </AccordionTrigger>

                <AccordionContent class="mt-4 pb-0 overflow-hidden">
                  <Card class="bg-white border-neutral-200 shadow-none p-3 gap-0 overflow-hidden">
                    <CardHeader class="p-0 flex flex-row items-center justify-between space-y-0">
                      <CardTitle class="text-xs font-semibold text-neutral-900">
                        Fall 2026
                      </CardTitle>
                    </CardHeader>

                    <CardContent class="p-0 mt-1">
                      <p class="text-[11px] text-neutral-400 whitespace-nowrap">
                        Aug 24 — Dec 18, 2026
                      </p>

                      <Progress :model-value="42" class="mt-3 h-1 bg-neutral-100" />

                      <p class="mt-1.5 text-[10px] text-neutral-400 whitespace-nowrap">
                        Week 3 of 16
                      </p>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </AppSidebar>

      <SidebarInset class="flex flex-1 flex-col">
        <AppHeader
          :view="view"
          @add-assignment="openAdd('assignment')"
          @add-material="openAdd('material')"
          @navigate="view = $event"
        >
          <template #actions>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="icon" class="size-9">
                  <Plus class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem @click="openAdd('assignment')">
                  <SquareCheck class="mr-2 size-4 text-neutral-500" />
                  <span>New Assignment</span>
                </DropdownMenuItem>
                <DropdownMenuItem @click="openAdd('material')">
                  <FileText class="mr-2 size-4 text-neutral-500" />
                  <span>New Material</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </template>
        </AppHeader>

        <slot />
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