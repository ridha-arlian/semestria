<script setup lang="ts">
  import { BookOpen, Check, LayoutDashboard, Plus, SquareCheck, FileText } from '@lucide/vue'
  import type { Task, BreadcrumbEntry, ModalType, Material, View, TaskPayload, MaterialPayload, TaskPriority } from '~/types/dashboard'

  const route = useRoute()

  const routeMap: Record<View, string> = {
    'Overview': '/workspaces',
    'Tasks': '/tasks',
    'Materials': '/materials',
    'All Workspaces': '/dashboard',
  }

  const view = computed<View>(() => {
    const match = Object.entries(routeMap).find(([, to]) => to === route.path)
    return (match?.[0] as View) ?? 'Overview'
  })

  function handleNavigate(target: View) {
    navigateTo(routeMap[target])
  }

  const showModal = ref(false)
  const modalType = ref<ModalType>('task')

  const breadcrumbExtra = ref<BreadcrumbEntry[]>([])
  provide('breadcrumbExtra', breadcrumbExtra)

  const workspaceName = ref('Fall 2026')

  const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
    const base: BreadcrumbEntry[] = [
      { label: 'Dashboard', to: 'dashboard' },
      { label: workspaceName.value, view: 'Overview' },
    ]
    if (view.value !== 'Overview') {
      base.push({ label: view.value, view: view.value })
    }
    return [...base, ...breadcrumbExtra.value]
  })

  watch(view, () => { breadcrumbExtra.value = [] })

  const tasks = ref<Task[]>([
    { id: 1, task: 'Research proposal', course: 'Design Research', due: 'Sep 20, 2026', status: 'In progress', priority: 'High', progress: 65 },
    { id: 2, task: 'Midterm reflection essay', course: 'Cultural Studies', due: 'Sep 24, 2026', status: 'To do', priority: 'Medium', progress: 0 },
    { id: 3, task: 'Prototype v2 presentation', course: 'Interaction Design', due: 'Sep 25, 2026', status: 'In progress', priority: 'High', progress: 40 },
    { id: 4, task: 'Reading response #04', course: 'Design Research', due: 'Sep 26, 2026', status: 'To do', priority: 'Low', progress: 0 },
    { id: 5, task: 'Group critique notes', course: 'Studio Practice', due: 'Sep 30, 2026', status: 'To do', priority: 'Medium', progress: 0 },
    { id: 6, task: 'Final case study', course: 'Cultural Studies', due: 'Sep 22, 2026', status: 'Done', priority: 'Low', progress: 100 },
  ])

  const materials = ref<Material[]>([
    { id: 1, title: 'The Design of Everyday Things', course: 'Interaction Design', type: 'Book', tags: 'reading, theory', reviewed: 'Yesterday' },
    { id: 2, title: 'Week 03 — Research methods', course: 'Design Research', type: 'Slides', tags: 'methods, week 03', reviewed: 'Sep 08' },
    { id: 3, title: 'Studio references / 2026', course: 'Studio Practice', type: 'Collection', tags: 'references', reviewed: 'Sep 05' },
    { id: 4, title: 'Cultural identity notes', course: 'Cultural Studies', type: 'Notes', tags: 'identity, key terms', reviewed: 'Aug 29' },
  ])

  const courses = computed(() => [...new Set([...tasks.value, ...materials.value].map(i => i.course))])

  const priorityMap: Record<TaskPriority, Task['priority']> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }

  function formatDue(iso: string) {
    if (!iso)
      return 'No due date'
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function handleTaskSubmit(payload: TaskPayload, addAnother: boolean) {
    tasks.value.unshift({
      id: Date.now(),
      task: payload.title,
      course: payload.course,
      due: formatDue(payload.due),
      status: 'To do',
      priority: priorityMap[payload.priority],
      progress: 0,
      description: payload.description,
    })
    if (!addAnother)
      showModal.value = false
  }

  function handleMaterialSubmit(payload: MaterialPayload, addAnother: boolean) {
    materials.value.unshift({
      id: Date.now(),
      title: payload.title,
      course: payload.course,
      type: payload.type,
      tags: payload.tags.join(', '),
      url: payload.url,
      description: payload.description,
      taskId: payload.taskId ?? undefined,
      reviewed: 'Just now',
    })
    if (!addAnother)
      showModal.value = false
  }

  function openAdd(type: ModalType) {
    modalType.value = type
    showModal.value = true
  }

  function cycleStatus(item: Task) {
    item.status = item.status === 'To do' ? 'In progress' : item.status === 'In progress' ? 'Done' : 'To do'
    item.progress = item.status === 'Done' ? 100 : item.status === 'In progress' ? 50 : 0
  }

  function removeTask(id: number) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  provide('workspace', {
    view,
    tasks,
    materials,
    openAdd,
    cycleStatus,
    removeTask,
  })

  const mainNavItems = [
    { name: 'Overview' as const, icon: LayoutDashboard, to: routeMap.Overview },
    { name: 'Tasks' as const, icon: Check, to: routeMap.Tasks },
    { name: 'Materials' as const, icon: BookOpen, to: routeMap.Materials },
  ]

  const collapseWrap = 'grid grid-cols-[1fr] transition-[grid-template-columns] duration-200 ease-linear group-data-[collapsible=icon]:grid-cols-[0fr]'
  const menuButtonClass = 'w-full justify-start gap-3 px-3 py-2.5 text-[14px]'
</script>

<template>
  <SidebarProvider>
    <div class="min-h-screen w-full bg-paper text-ink flex">
      <LayoutsAppSidebar>
        <SidebarGroup class="p-0">
          <div :class="collapseWrap">
            <SidebarGroupLabel class="overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-subline whitespace-nowrap">
              Workspace
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent class="mt-2 group-data-[collapsible=icon]:mt-0">
            <SidebarMenu class="space-y-1">
              <SidebarMenuItem v-for="item in mainNavItems" :key="item.name" class="flex justify-center overflow-hidden">
                <SidebarMenuButton
                  as-child
                  :is-active="route.path === item.to"
                  :tooltip="item.name"
                  :class="menuButtonClass"
                >
                  <NuxtLink :to="item.to">
                    <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.8" />

                    <div :class="collapseWrap">
                      <span class="overflow-hidden truncate whitespace-nowrap">
                        {{ item.name }}
                      </span>
                    </div>

                    <div v-if="item.name === 'Tasks'" class="ml-auto flex items-center transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                      <SidebarMenuBadge class="rounded bg-soft px-1.5 py-0.5 text-[10px] font-normal text-strong">
                        {{ tasks.length }}
                      </SidebarMenuBadge>
                    </div>
                  </NuxtLink>
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
                  <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-subline hover:text-ink transition-colors">
                    Timeline
                  </SidebarGroupLabel>
                </AccordionTrigger>

                <AccordionContent class="mt-4 pb-0 overflow-hidden">
                  <Card class="bg-card border-line shadow-none p-3 gap-0 overflow-hidden">
                    <CardHeader class="p-0 flex flex-row items-center justify-between space-y-0">
                      <CardTitle class="text-xs font-semibold text-headline">
                        Fall 2026
                      </CardTitle>
                    </CardHeader>

                    <CardContent class="p-0 mt-1">
                      <p class="text-[11px] text-subline whitespace-nowrap">
                        Aug 24 — Dec 18, 2026
                      </p>

                      <Progress :model-value="42" class="mt-3 h-1 bg-soft" />

                      <p class="mt-1.5 text-[10px] text-subline whitespace-nowrap">
                        Week 3 of 16
                      </p>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </LayoutsAppSidebar>

      <SidebarInset class="flex flex-1 flex-col">
        <LayoutsAppHeader
          :view="view"
          :breadcrumbs="breadcrumbs"
          @add-task="openAdd('task')"
          @add-material="openAdd('material')"
          @navigate="handleNavigate"
        >
          <template #actions>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="icon" class="size-9">
                  <Plus class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem @click="openAdd('task')">
                  <SquareCheck class="mr-2 size-4 text-subline" />
                  <span>New Task</span>
                </DropdownMenuItem>
                <DropdownMenuItem @click="openAdd('material')">
                  <FileText class="mr-2 size-4 text-subline" />
                  <span>New Material</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </template>
        </LayoutsAppHeader>

        <div class="border-b border-line bg-paper px-5 py-2.5 md:hidden">
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(crumb, i) in breadcrumbs" :key="crumb.label">
                <BreadcrumbItem>
                  <BreadcrumbLink v-if="i < breadcrumbs.length - 1" as-child class="text-subline transition-colors hover:text-ink">
                    <NuxtLink v-if="crumb.to" :to="crumb.to" class="flex items-center gap-1 text-xs">
                      {{ crumb.label }}
                    </NuxtLink>
                    <NuxtLink v-else-if="crumb.view" class="cursor-pointer text-xs" @click="handleNavigate(crumb.view)">
                      {{ crumb.label }}
                    </NuxtLink>
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else class="text-xs font-medium text-headline">
                    {{ crumb.label }}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="i < breadcrumbs.length - 1" class="text-subline" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <slot />
      </SidebarInset>

      <WorkspacesModalTask
        :open="showModal && modalType === 'task'"
        :courses="courses"
        @close="showModal = false"
        @submit="handleTaskSubmit"
      />
      <WorkspacesModalMaterial
        :open="showModal && modalType === 'material'"
        :courses="courses"
        :tasks="tasks"
        @close="showModal = false"
        @submit="handleMaterialSubmit"
      />
    </div>
  </SidebarProvider>
</template>