<script setup lang="ts">
  import { Plus, Search, Sparkles } from '@lucide/vue'
  import DataTable from '~/components/ui/data-table/DataTable.vue'
  import { tasksPageColumns } from '~/components/workspaces/tasks-page-columns.ts'
  import type { Task, Status, ModalType } from '~/types'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  interface WorkspaceContext {
    tasks: Ref<Task[]>
    openAdd: (type: ModalType) => void
    cycleStatus: (item: Task) => void
    removeTask: (id: number) => void
  }

  const { tasks, openAdd, cycleStatus, removeTask } = inject<WorkspaceContext>('workspace')!

  const search = ref('')
  const statusFilter = ref<'All' | Status>('All')

  const filtered = computed(() =>
    tasks.value.filter(t =>
      [t.task, t.course, t.status, t.priority].join(' ').toLowerCase().includes(search.value.toLowerCase())
      && (statusFilter.value === 'All' || t.status === statusFilter.value),
    ),
  )

  const isFiltering = computed(() => search.value.trim() !== '' || statusFilter.value !== 'All')
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-subline">
          Keep every deadline in sight, without the spreadsheet stiffness.
        </p>
        <Button class="w-full sm:w-auto" @click="openAdd('task')">
          <Plus class="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subline" />
          <Input
            v-model="search"
            class="bg-card pl-9"
            placeholder="Search tasks..."
          />
        </div>
        <Select v-model="statusFilter">
          <SelectTrigger class="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="All" class="cursor-pointer text-xs">All statuses</SelectItem>
            <SelectItem value="To do" class="cursor-pointer text-xs">To do</SelectItem>
            <SelectItem value="In progress" class="cursor-pointer text-xs">In progress</SelectItem>
            <SelectItem value="Done" class="cursor-pointer text-xs">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card class="overflow-hidden">
        <CardContent class="p-0">
          <DataTable
            :columns="tasksPageColumns"
            :data="filtered"
            :mobile-hidden-columns="['course', 'due', 'progress', 'status']"
            show-header
            :column-class="{
              priority: 'w-12 px-0! text-center',
              course: 'w-44 shrink-0',
              due: 'w-36 shrink-0',
              status: 'w-24 sm:w-32 shrink-0',
              progress: 'w-52 shrink-0',
              actions: 'w-16 sm:w-[120px] shrink-0',
            }"
            empty-text="Nothing found — try a different search or add something new."
            :meta="{
              onChangeStatus: (t) => cycleStatus(t),
              onDelete: (t) => removeTask(t.id),
            }"
          >
            <template #empty>
              <div class="px-5 py-16 text-center">
                <Sparkles class="mx-auto size-5 text-subline/50" />
                <p class="mt-3 text-sm font-medium text-text-strong">
                  {{ isFiltering ? 'No tasks match your filters' : 'No tasks yet' }}
                </p>
                <p class="mt-1 text-xs text-subline">
                  {{ isFiltering ? 'Try a different search or status filter.' : 'Add your first task to get started.' }}
                </p>
              </div>
            </template>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
