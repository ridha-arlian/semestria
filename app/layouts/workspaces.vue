<script setup lang="ts">
  import { BookOpen, Check, LayoutDashboard, Plus, SquareCheck, FileText } from '@lucide/vue'
  import type { Task, BreadcrumbEntry, ModalType, Material, MaterialActivity, MaterialContentInput, MaterialNote, View, TaskPayload, MaterialPayload, WorkspaceTimeline } from '~/types'
  import { planTypeChange } from '~/utils/materialContent'
  import { useActivityCache } from '~/composables/apiCache'

  const route = useRoute()
  const api = useApi()

  const slug = computed(() => route.params.slug as string)
  const workspace = computed(() => api.getWorkspaceBySlug(slug.value))
  const workspaceName = computed(() => workspace.value?.name ?? '')
  const workspaceKey = computed(() => `workspace:${workspace.value?.id ?? 0}`)
  const { ready: workspaceReady } = useDataStatus(workspaceKey)
  // The count skeleton is a client-navigation affordance; SSR either has the
  // data or renders the error page, so never emit a skeleton in server HTML.
  const showCountSkeleton = computed(() => import.meta.client && !workspaceReady.value)

  const week = computed<WorkspaceTimeline | null>(() => {
    const w = workspace.value
    if (!w?.startDate || !w?.endDate) return null

    const DAY = 24 * 60 * 60 * 1000
    const start = new Date(`${w.startDate}T00:00:00`).getTime()
    const end = new Date(`${w.endDate}T00:00:00`).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalDays = Math.max(1, Math.round((end - start) / DAY))
    const daysElapsed = Math.min(Math.max(Math.round((today.getTime() - start) / DAY), 0), totalDays)
    const daysUntilStart = Math.max(Math.ceil((start - today.getTime()) / DAY), 0)
    const daysLeft = Math.max(Math.ceil((end - today.getTime()) / DAY), 0)
    const total = Math.max(1, Math.ceil(totalDays / 7))
    const current = daysUntilStart > 0
      ? 1
      : Math.min(Math.floor(daysElapsed / 7) + 1, total)
    const state = daysUntilStart > 0 ? 'upcoming' : daysLeft <= 0 ? 'ended' : 'active'

    return { current, total, totalDays, daysElapsed, daysUntilStart, daysLeft, state }
  })

  const routeMap = computed<Record<View, string>>(() => ({
    'Overview': `/workspaces/${slug.value}`,
    'Tasks': `/workspaces/${slug.value}/tasks`,
    'Materials': `/workspaces/${slug.value}/materials`,
    'All Workspaces': '/dashboard',
  }))

  const view = computed<View>(() => {
    const path = route.path.replace(/\/$/, '')
    const match = Object.entries(routeMap.value).find(([, to]) => to === path)
    if (match)
      return match[0] as View
    // Detail sub-pages (e.g. /tasks/:id) belong to their section
    if (path.startsWith(`${routeMap.value.Tasks}/`))
      return 'Tasks'
    if (path.startsWith(`${routeMap.value.Materials}/`))
      return 'Materials'
    return 'Overview'
  })

  function handleNavigate(target: View) {
    navigateTo(routeMap.value[target])
  }

  const showModal = ref(false)
  const modalType = ref<ModalType>('task')

  const breadcrumbExtra = ref<BreadcrumbEntry[]>([])
  provide('breadcrumbExtra', breadcrumbExtra)

  const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
    const base: BreadcrumbEntry[] = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: workspaceName.value, view: 'Overview' },
    ]
    if (view.value !== 'Overview') {
      base.push({ label: view.value, view: view.value })
    }
    return [...base, ...breadcrumbExtra.value]
  })

  const tasksState = api.getTaskState()
  const materialsState = api.getMaterialState()
  const tasks = computed(() => tasksState.value.filter(t => t.workspaceId === workspace.value?.id))
  const materials = computed(() => materialsState.value.filter(m => m.workspaceId === workspace.value?.id))

  // Persisted activity history across navigation. Shared with `useApi`
  // through the same `api-activities` cache key.
  const materialActivities = useActivityCache()
  const nextInt = useState<number>('material-local-seq', () => 1000)

  // Recompute derived progress whenever the live task collection changes.
  watch(tasks, (list) => list.forEach(recalcTask), { immediate: true })

  const courses = computed(() => [...new Set([...tasks.value, ...materials.value].map(i => i.course))])

  async function handleTaskSubmit(payload: TaskPayload, addAnother: boolean) {
    await api.addTask(workspace.value!.id, payload)
    if (!addAnother)
      showModal.value = false
  }

  async function handleMaterialSubmit(payload: MaterialPayload, addAnother: boolean) {
    await api.addMaterial(workspace.value!.id, payload)
    if (!addAnother)
      showModal.value = false
  }

  function openAdd(type: ModalType) {
    modalType.value = type
    showModal.value = true
  }

  function recalcTask(item: Task) {
    const list = item.checklist
    if (!list?.length)
      return
    item.progress = Math.round((list.filter(s => s.done).length / list.length) * 100)
  }

  function syncStatusFromChecklist(item: Task) {
    const list = item.checklist
    if (!list?.length)
      return
    if (list.every(s => s.done))
      item.status = 'Done'
    else if (list.some(s => s.done))
      item.status = 'In progress'
    else
      item.status = 'To do'
  }

  async function cycleStatus(item: Task) {
    const next = item.status === 'To do' ? 'In progress' : item.status === 'In progress' ? 'Done' : 'To do'
    const prevStatus = item.status
    const prevProgress = item.progress
    item.status = next
    const list = item.checklist
    if (list?.length) {
      if (next === 'Done')
        list.forEach(s => s.done = true)
      else if (next === 'To do')
        list.forEach(s => s.done = false)
      recalcTask(item)
    }
    else {
      item.progress = next === 'Done' ? 100 : next === 'In progress' ? 50 : 0
    }
    try {
      await api.request(`/api/tasks/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
    }
    catch {
      item.status = prevStatus
      item.progress = prevProgress
      if (list?.length) recalcTask(item)
    }
  }

  async function toggleSubtask(item: Task, subId: number) {
    const sub = item.checklist?.find(s => s.id === subId)
    if (!sub)
      return
    sub.done = !sub.done
    recalcTask(item)
    syncStatusFromChecklist(item)
    try {
      const updated = await api.request<{ done: boolean }>(`/api/checklist/${subId}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: sub.done }),
      })
      sub.done = updated.done
      recalcTask(item)
      syncStatusFromChecklist(item)
    }
    catch {
      sub.done = !sub.done
      recalcTask(item)
      syncStatusFromChecklist(item)
    }
  }

  async function addSubtask(item: Task, title: string) {
    const text = title.trim()
    if (!text)
      return
    const created = await api.request<{ id: number, title: string, done: boolean }>(
      `/api/tasks/${item.id}/checklist`,
      { method: 'POST', body: JSON.stringify({ title: text }) },
    )
    item.checklist ??= []
    item.checklist.push({ ...created })
    recalcTask(item)
    syncStatusFromChecklist(item)
  }

  async function updateSubtask(item: Task, subId: number, title: string) {
    const text = title.trim()
    if (!text)
      return
    const sub = item.checklist?.find(s => s.id === subId)
    if (!sub)
      return
    sub.title = text
    await api.request(`/api/checklist/${subId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: text }),
    })
  }

  async function removeSubtask(item: Task, subId: number) {
    if (!item.checklist)
      return
    item.checklist = item.checklist.filter(s => s.id !== subId)
    recalcTask(item)
    syncStatusFromChecklist(item)
    await api.request(`/api/checklist/${subId}`, { method: 'DELETE' })
  }

  function normalizeUrl(raw: string) {
    const text = raw.trim()
    if (!text)
      return ''
    return /:\/\//.test(text) ? text : `https://${text}`
  }

  async function addSubmissionUrl(item: Task, url: string) {
    const value = normalizeUrl(url)
    if (!value)
      return
    const created = await api.request<{ id: number, url: string }>(
      `/api/tasks/${item.id}/submissions`,
      { method: 'POST', body: JSON.stringify({ url: value }) },
    )
    item.submissionUrls ??= []
    item.submissionUrls.push(created.url)
  }

  async function updateSubmissionUrl(item: Task, index: number, url: string) {
    const value = normalizeUrl(url)
    const old = item.submissionUrls?.[index]
    if (!value || !old)
      return
    item.submissionUrls![index] = value
    const subs = await api.request<{ id: number, url: string }[]>(`/api/tasks/${item.id}/submissions`)
    const target = subs[index]
    if (!target) return
    await api.request(`/api/submissions/${target.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ url: value }),
    })
  }

  async function removeSubmissionUrl(item: Task, index: number) {
    if (!item.submissionUrls?.[index])
      return
    const subs = await api.request<{ id: number, url: string }[]>(`/api/tasks/${item.id}/submissions`)
    const target = subs[index]
    item.submissionUrls = item.submissionUrls.filter((_, i) => i !== index)
    if (target) {
      await api.request(`/api/submissions/${target.id}`, { method: 'DELETE' })
    }
  }

  async function updateNote(item: Task, text: string) {
    item.note = text
    await api.request(`/api/tasks/${item.id}`, { method: 'PATCH', body: JSON.stringify({ note: text }) })
  }

  async function removeTask(id: number) {
    // Removes the task and unlinks any material that pointed at it.
    await api.removeTask(id)
  }

  async function updateTask(id: number, payload: TaskPayload) {
    const updated = await api.patchTask(id, {
      title: payload.title,
      course: payload.course,
      due: payload.due,
      priority: payload.priority,
      description: payload.description,
    })
    const item = tasks.value.find((t) => t.id === id)
    if (item) Object.assign(item, updated)
  }

  function getMaterialActivities(material: Material): MaterialActivity[] {
    return materialActivities.value[material.id] ?? []
  }

  async function ensureMaterialActivities(materialId: number) {
    if (materialActivities.value[materialId])
      return
    await api.fetchActivities(materialId)
  }

  function revokeBlobUrl(url?: string) {
    if (import.meta.client && url?.startsWith('blob:'))
      URL.revokeObjectURL(url)
  }

  function nextLinkId() {
    return nextInt.value++
  }

  function applyContentPlan(item: Material, plan: ReturnType<typeof planTypeChange>) {
    const prevUrl = item.url
    item.url = plan.url
    item.contentSource = plan.source
    item.links = plan.links.length ? plan.links.map(l => (l.id === 0 ? { ...l, id: nextLinkId() } : l)) : undefined
    item.fileName = plan.fileName
    item.fileSize = plan.fileSize
    if (prevUrl && prevUrl !== plan.url)
      revokeBlobUrl(prevUrl)
  }

  async function updateMaterial(id: number, payload: MaterialPayload) {
    const item = materials.value.find(m => m.id === id)
    if (!item)
      return
    const prevType = item.type
    const plan = prevType !== payload.type ? planTypeChange(item, payload.type) : null
    const hadContent = !!item.url || (item.links?.length ?? 0) > 0
    const prevPrimary = item.taskId
    const linkedBefore = linkedTaskIds(item)

    item.title = payload.title
    item.course = payload.course
    item.type = payload.type
    item.tags = payload.tags.join(', ')

    if (plan) {
      applyContentPlan(item, plan)
    }

    const updated = await api.patchMaterial(id, {
      title: payload.title,
      course: payload.course,
      type: payload.type,
      tags: payload.tags,
    })
    Object.assign(item, updated)

    // The edit form picks one primary task. Diff only that link so the other
    // task links made from the detail page survive the edit.
    item.taskId = prevPrimary
    const nextPrimary = payload.taskId ?? undefined
    if (nextPrimary !== prevPrimary) {
      const next = linkedBefore.filter(tid => tid !== prevPrimary)
      if (nextPrimary !== undefined)
        next.push(nextPrimary)
      await setMaterialTasks(id, next)
    }

    // Server logs 'Tag added' / 'Edited' / 'Content removed' as needed.
    void (async () => {
      if (plan?.lost && hadContent) {
        // Already handled server-side via type-change plan.
      }
    })()
  }

  function linkedTaskIds(material: Material): number[] {
    const ids = new Set<number>()
    if (material.taskId)
      ids.add(material.taskId)
    for (const t of tasks.value) {
      if (t.materialIds?.includes(material.id))
        ids.add(t.id)
    }
    return [...ids]
  }

  async function setMaterialTasks(id: number, taskIds: number[], _silent = false) {
    const item = materials.value.find(m => m.id === id)
    if (!item)
      return

    // Snapshot the current links BEFORE mutating local state, otherwise the
    // diff below is empty and nothing is ever persisted.
    const prev = linkedTaskIds(item)
    const prevPrimary = item.taskId
    const next = new Set(taskIds)
    const toAdd = [...next].filter(tid => !prev.includes(tid))
    const toRemove = prev.filter(tid => !next.has(tid))

    // Sync task.materialIds locally for UI.
    for (const t of tasks.value) {
      const has = t.materialIds?.includes(id) ?? false
      const should = next.has(t.id)
      if (has === should)
        continue
      const list = t.materialIds ?? []
      t.materialIds = should ? [...list, id] : list.filter(mid => mid !== id)
      if (!t.materialIds.length)
        t.materialIds = undefined
    }
    const primary = prevPrimary && next.has(prevPrimary) ? prevPrimary : next.values().next().value
    item.taskId = primary ?? undefined

    try {
      for (const taskId of toAdd) {
        await api.request(`/api/tasks/${taskId}/materials`, {
          method: 'POST',
          body: JSON.stringify({ materialId: id }),
        })
      }
      for (const taskId of toRemove) {
        await api.request(`/api/tasks/${taskId}/materials/${id}`, { method: 'DELETE' })
      }
    }
    catch (e) {
      // Restore the pre-mutation links so the UI matches the server.
      for (const t of tasks.value) {
        const had = prev.includes(t.id)
        const list = (t.materialIds ?? []).filter(mid => mid !== id)
        t.materialIds = had ? [...list, id] : (list.length ? list : undefined)
      }
      item.taskId = prevPrimary
      throw e
    }
  }

  async function linkMaterialTask(id: number, taskId: number) {
    const item = materials.value.find(m => m.id === id)
    if (!item)
      return
    const current = linkedTaskIds(item)
    if (current.includes(taskId))
      return
    await setMaterialTasks(id, [...current, taskId])
  }

  async function unlinkMaterialTask(id: number, taskId: number) {
    const item = materials.value.find(m => m.id === id)
    if (!item)
      return
    await setMaterialTasks(id, linkedTaskIds(item).filter(tid => tid !== taskId))
  }

  async function updateMaterialNote(id: number, note: MaterialNote) {
    const item = materials.value.find((m) => m.id === id)
    if (!item) return
    const same = JSON.stringify(item.description ?? null) === JSON.stringify(note ?? null)
    if (same) return
    item.description = note
    await api.request(`/api/materials/${id}/note`, { method: 'PATCH', body: JSON.stringify({ note }) })
  }

  async function setMaterialContent(id: number, content: MaterialContentInput | null) {
    const item = materials.value.find(m => m.id === id)
    if (!item)
      return
    const prevUrl = item.url

    let updated: Material
    if (!content || !content.url) {
      updated = await api.request<Material>(`/api/materials/${id}/content`, { method: 'DELETE' })
    }
    else {
      const body = content.source === 'link'
        ? { url: content.url, source: 'link' }
        : { url: content.url, source: 'file', fileName: content.fileName, fileSize: content.fileSize }
      updated = await api.request<Material>(`/api/materials/${id}/content`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    }

    if (prevUrl && prevUrl !== updated.url)
      revokeBlobUrl(prevUrl)
    Object.assign(item, updated)
  }

  async function addMaterialLink(id: number, link: { url: string, label?: string }) {
    const item = materials.value.find(m => m.id === id)
    if (!item || !link.url.trim())
      return
    const created = await api.request<{ id: number, url: string, label?: string }>(`/api/materials/${id}/links`, {
      method: 'POST',
      body: JSON.stringify(link),
    })
    item.links = [...(item.links ?? []), created]
  }

  async function updateMaterialLink(id: number, linkId: number, patch: { url?: string, label?: string }) {
    const item = materials.value.find(m => m.id === id)
    const link = item?.links?.find(l => l.id === linkId)
    if (!link)
      return
    if (patch.url !== undefined) link.url = patch.url
    if (patch.label !== undefined) link.label = patch.label.trim() || undefined
    await api.request(`/api/material-links/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }

  async function removeMaterialLink(id: number, linkId: number) {
    const item = materials.value.find(m => m.id === id)
    if (!item) return
    item.links = item.links?.filter(l => l.id !== linkId)
    if (!item.links?.length) item.links = undefined
    await api.request(`/api/material-links/${linkId}`, { method: 'DELETE' })
  }

  async function markMaterialReviewed(id: number) {
    const item = materials.value.find(m => m.id === id)
    if (!item) return
    const { reviewedAt } = await api.request<{ reviewedAt: string }>(`/api/materials/${id}/review`, { method: 'POST' })
    // Reconcile with the server timestamp instead of labelling it locally
    // before the request resolves.
    item.reviewedAt = reviewedAt
    item.reviewed = 'Just now'
  }

  async function markMaterialOpened(id: number) {
    const item = materials.value.find(m => m.id === id)
    if (!item) return
    try {
      await api.request<{ lastOpenedAt: string }>(`/api/materials/${id}/open`, { method: 'POST' })
      item.lastOpened = 'Just now'
    }
    catch {
      // Best-effort: opening a material should never block the page.
    }
  }

  async function removeMaterial(id: number) {
    const item = materials.value.find(m => m.id === id)
    if (item) revokeBlobUrl(item.url)
    await api.removeMaterial(id)
    const { [id]: _removed, ...rest } = materialActivities.value
    materialActivities.value = rest
  }

  provide('workspace', {
    workspace,
    week,
    view,
    tasks,
    materials,
    materialActivities,
    openAdd,
    updateTask,
    cycleStatus,
    removeTask,
    toggleSubtask,
    addSubtask,
    updateSubtask,
    removeSubtask,
    addSubmissionUrl,
    updateSubmissionUrl,
    removeSubmissionUrl,
    updateNote,
    updateMaterial,
    updateMaterialNote,
    setMaterialContent,
    addMaterialLink,
    updateMaterialLink,
    removeMaterialLink,
    linkMaterialTask,
    unlinkMaterialTask,
    markMaterialReviewed,
    markMaterialOpened,
    removeMaterial,
    getMaterialActivities,
    ensureMaterialActivities,
  })

  const mainNavItems = computed(() => [
    { name: 'Overview' as const, icon: LayoutDashboard, to: routeMap.value.Overview },
    { name: 'Tasks' as const, icon: Check, to: routeMap.value.Tasks },
    { name: 'Materials' as const, icon: BookOpen, to: routeMap.value.Materials },
  ])

  function isNavActive(to: string) {
    // Detail sub-pages keep their section highlighted
    return route.path === to || (to !== routeMap.value.Overview && route.path.startsWith(`${to}/`))
  }

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
            <SidebarMenu class="gap-2">
              <SidebarMenuItem v-for="item in mainNavItems" :key="item.name" class="flex justify-center overflow-hidden">
                <SidebarMenuButton
                  as-child
                  :is-active="isNavActive(item.to)"
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
                      <Skeleton v-if="showCountSkeleton" class="h-3.5 w-6 rounded" />
                      <SidebarMenuBadge v-else class="rounded bg-soft px-1.5 py-0.5 text-[10px] font-normal text-text-strong">
                        {{ tasks.length }}
                      </SidebarMenuBadge>
                    </div>

                    <div v-if="item.name === 'Materials'" class="ml-auto flex items-center transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                      <Skeleton v-if="showCountSkeleton" class="h-3.5 w-6 rounded" />
                      <SidebarMenuBadge v-else class="rounded bg-soft px-1.5 py-0.5 text-[10px] font-normal text-text-strong">
                        {{ materials.length }}
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
                <AccordionTrigger class="h-auto py-0 flex items-center justify-start gap-1.5 hover:no-underline [&>svg]:translate-y-0 [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0 opacity-100 md:[&>svg]:opacity-0 md:hover:[&>svg]:opacity-100">
                  <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-subline hover:text-ink transition-colors">
                    Timeline
                  </SidebarGroupLabel>
                </AccordionTrigger>

                <AccordionContent class="mt-4 pb-0 overflow-hidden">
                  <Card class="bg-card border-line shadow-none p-3 gap-0 overflow-hidden">
                    <CardHeader class="p-0 flex flex-row items-center justify-between">
                      <CardTitle class="text-xs font-semibold text-headline">
                        <Skeleton v-if="!workspace" class="h-3 w-24" />
                        <template v-else>
                          {{ workspace.name }}
                        </template>
                      </CardTitle>
                    </CardHeader>

                    <CardContent class="p-0 mt-1">
                      <Skeleton v-if="!workspace" class="mt-0.5 h-2.5 w-28" />
                      <p v-else class="text-[11px] text-subline whitespace-nowrap">
                        {{ workspace.dates }}
                      </p>

                      <Progress :model-value="workspace?.progress ?? 0" class="mt-3 h-1 bg-soft" />

                      <p v-if="week" class="mt-1.5 text-[10px] text-subline whitespace-nowrap">
                        Week {{ week.current }} of {{ week.total }}
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
                <DropdownMenuGroup>
                  <DropdownMenuItem @click="openAdd('task')">
                    <SquareCheck class="mr-2 size-4 text-subline" />
                    <span>New Task</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openAdd('material')">
                    <FileText class="mr-2 size-4 text-subline" />
                    <span>New Material</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
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
        :start-date="workspace?.startDate"
        :end-date="workspace?.endDate"
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