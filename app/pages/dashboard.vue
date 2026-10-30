<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
  import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
  import { Plus, FolderOpen, CheckCircle2, Pencil, Trash2 } from '@lucide/vue'
  import DataTable from '@/components/ui/data-table/DataTable.vue'
  import { columns } from '~/components/dashboard/workspaceColumns'
  import type { StatItem, Workspace, WorkspaceFormPayload } from '~/types'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import NewWorkspaceDialog from '~/components/dashboard/NewWorkspaceDialog.vue'
  import DeleteConfirmDialog from '~/components/DeleteConfirmDialog.vue'

  definePageMeta({
    layout: 'dashboard',
  })

  const api = useApi()
  // Read through a computed: TanStack Table memoizes on the data array
  // reference, so add/delete must produce a new array for the rows to refresh.
  const workspaces = computed(() => api.getWorkspaces())

  const isModalOpen = ref(false)
  const selectedWorkspace = ref<Workspace | null>(null)

  const isDeleteModalOpen = ref(false)
  const workspaceToDelete = ref<Workspace | null>(null)

  function handleCreateNew() {
    selectedWorkspace.value = null
    isModalOpen.value = true
  }

  function handleEditWorkspace(workspace: Workspace) {
    selectedWorkspace.value = workspace
    isModalOpen.value = true
  }

  function handleDeleteWorkspace(workspace: Workspace) {
    workspaceToDelete.value = workspace
    isDeleteModalOpen.value = true
  }

  function handleConfirmDelete(workspace: Workspace) {
    api.removeWorkspace(workspace.id)
    workspaceToDelete.value = null
    isDeleteModalOpen.value = false
  }

  function handleWorkspaceSuccess(data: WorkspaceFormPayload) {
    if (selectedWorkspace.value) {
      api.updateWorkspace(selectedWorkspace.value.id, data)
    } else {
      api.addWorkspace(data)
    }
    selectedWorkspace.value = null
    isModalOpen.value = false
  }

  function handleRowClick(workspace: Workspace) {
    navigateTo(`/workspaces/${workspace.slug}`)
  }

  function handleSetActive(workspace: Workspace) {
    api.setActiveWorkspace(workspace.id)
  }

  const totalAssignments = computed(() => workspaces.value.reduce((sum, w) => sum + w.assignments, 0))
  const completedAssignments = computed(() => workspaces.value.reduce((sum, w) => sum + w.completed, 0))
  const activeWorkspace = computed(() => workspaces.value.find(w => w.active))

  const activeWeek = computed(() => {
    const w = activeWorkspace.value
    if (!w?.startDate || !w?.endDate)
      return null
    const WEEK = 7 * 24 * 60 * 60 * 1000
    const start = new Date(`${w.startDate}T00:00:00`).getTime()
    const end = new Date(`${w.endDate}T00:00:00`).getTime()
    const total = Math.ceil((end - start) / WEEK)
    if (total <= 0)
      return null
    const current = Math.min(Math.max(Math.floor((Date.now() - start) / WEEK) + 1, 1), total)
    return { current, total }
  })

  const homeStats = computed<StatItem[]>(() => [
    { label: 'Workspaces', value: String(workspaces.value.length), note: 'workspaces in your space' },
    { label: 'Assignments', value: String(totalAssignments.value), note: `${completedAssignments.value} completed overall` },
    {
      label: 'Active semester',
      value: activeWorkspace.value?.name ?? '—',
      note: activeWeek.value ? `Week ${activeWeek.value.current} of ${activeWeek.value.total}` : 'No active semester',
    },
  ])
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-lg font-bold tracking-tight text-headline sm:hidden">
        All Workspaces
      </h1>
      <h1 class="hidden text-2xl font-bold tracking-tight text-headline sm:block">
        All Workspaces
      </h1>

      <Button class="w-full sm:w-auto" @click="handleCreateNew">
        <Plus class="mr-2 h-4 w-4" />
        New workspace
      </Button>
      
      <NewWorkspaceDialog
        v-model:open="isModalOpen"
        :workspace-to-edit="selectedWorkspace"
        @success="handleWorkspaceSuccess"
        @close="selectedWorkspace = null"
      />

      <DeleteConfirmDialog
        v-model:open="isDeleteModalOpen"
        title="Delete workspace"
        confirm-label="Delete workspace"
        @confirm="workspaceToDelete && handleConfirmDelete(workspaceToDelete)"
        @close="workspaceToDelete = null"
      >
        <template #description>
          Are you sure you want to delete <strong class="font-semibold text-destructive">{{ workspaceToDelete?.name }}</strong>? This action cannot be undone and will delete all associated courses and assignments.
        </template>
      </DeleteConfirmDialog>
    </div>

    <OverviewStats class="mt-6 sm:mt-8" :stats="homeStats" />

    <Card class="mt-6 overflow-hidden sm:mt-8">
      <CardHeader class="border-b border-line">
        <div>
          <CardTitle class="text-sm font-semibold text-headline">
            Your workspaces
          </CardTitle>
          <CardDescription class="mt-0.5 text-xs text-subline">
            Open a workspace to continue where you left off.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <DataTable
          :columns="columns"
          :data="workspaces"
          :mobile-hidden-columns="['progress', 'assignments']"
          :column-class="{
            progress: 'w-56 shrink-0',
            assignments: 'w-64 shrink-0',
          }"
          :meta="{
            onEdit: handleEditWorkspace,
            onDelete: handleDeleteWorkspace,
          }"
          @row-click="handleRowClick"
        >
          <template #empty>
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-strong">
                No workspaces yet
              </p>
              <p class="mt-1 text-xs text-subline">
                Create your first workspace to start organizing your semester.
              </p>
            </div>
          </template>
          <template #context-menu="{ row }">
            <ContextMenuItem class="cursor-pointer text-xs" @select="handleRowClick(row)">
              <FolderOpen class="mr-2 size-3.5 text-subline" /> Open workspace
            </ContextMenuItem>
            <ContextMenuItem v-if="!row.active" class="cursor-pointer text-xs" @select="handleSetActive(row)">
              <CheckCircle2 class="mr-2 size-3.5 text-subline" /> Set as active
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem class="cursor-pointer text-xs" @select="handleEditWorkspace(row)">
              <Pencil class="mr-2 size-3.5 text-subline" /> Edit workspace
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem class="cursor-pointer text-xs text-destructive focus:text-destructive" @select="handleDeleteWorkspace(row)">
              <Trash2 class="mr-2 size-3.5" /> Delete workspace
            </ContextMenuItem>
          </template>
        </DataTable>
      </CardContent>
    </Card>
  </main>
</template>