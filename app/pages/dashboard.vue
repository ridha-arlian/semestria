<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
  import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
  import { Plus, FolderOpen, CheckCircle2, Pencil, Trash2 } from '@lucide/vue'
  import DataTable from '@/components/ui/data-table/DataTable.vue'
  import { columns, type Workspace } from '~/components/dashboard/workspaceColumns.ts'
  import type { StatItem } from '~/types/dashboard'
  import OverviewStats from '~/components/dashboard/OverviewStats.vue'
  import NewWorkspaceDialog from '~/components/dashboard/NewWorkspaceDialog.vue'
  import DeleteWorkspaceDialog from '~/components/dashboard/DeleteWorkspaceDialog.vue'

  definePageMeta({
    layout: 'dashboard'
  })

  const router = useRouter()
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
    console.log('Proses hapus workspace:', workspace)
  }

  function handleWorkspaceSuccess(data: any) {
    if (selectedWorkspace.value) {
      console.log('Update workspace:', data)
    } else {
      console.log('Data workspace baru:', data)
    }
  }

  function handleRowClick(workspace: Workspace) {
    // router.push(`/workspaces/${workspace.name.toLowerCase().replace(/\s+/g, '-')}`)
    router.push(`/workspaces`)
  }

  function handleSetActive(workspace: Workspace) {
    console.log('Set aktif:', workspace)
  }

  const workspaces = [
    { name: 'Fall 2026', dates: 'Aug 24 — Dec 18, 2026', courses: 4, assignments: 5, completed: 1, progress: 42, active: true, next: 'Research proposal', nextDue: 'Sep 12' },
    { name: 'Spring 2026', dates: 'Jan 12 — May 08, 2026', courses: 5, assignments: 18, completed: 16, progress: 88, active: false, next: 'Semester complete', nextDue: '—' },
    { name: 'Fall 2025', dates: 'Aug 25 — Dec 19, 2025', courses: 4, assignments: 21, completed: 21, progress: 100, active: false, next: 'Semester complete', nextDue: '—' },
  ]

  const totalAssignments = workspaces.reduce((sum, w) => sum + w.assignments, 0)
  const completedAssignments = workspaces.reduce((sum, w) => sum + w.completed, 0)

  const homeStats = computed<StatItem[]>(() => [
    { label: 'Workspaces', value: String(workspaces.length), note: 'workspaces in your space' },
    { label: 'Assignments', value: String(totalAssignments), note: `${completedAssignments} completed overall` },
    { label: 'Active semester', value: 'Fall 2026', note: 'Week 3 of 16' },
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

      <DeleteWorkspaceDialog
        v-model:open="isDeleteModalOpen"
        :workspace="workspaceToDelete"
        @confirm="handleConfirmDelete"
        @close="workspaceToDelete = null"
      />
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
          :meta="{
            onEdit: handleEditWorkspace,
            onDelete: handleDeleteWorkspace,
          }"
          @row-click="handleRowClick"
        >
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