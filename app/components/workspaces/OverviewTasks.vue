<script setup lang="ts">
  import { ArrowUpRight, ArrowUpDown } from '@lucide/vue'
  import DataTable from '~/components/ui/data-table/DataTable.vue'
  import { overviewTasksColumns } from '~/components/workspaces/overview-tasks-columns.ts'
  import type { Task } from '~/types'

  const props = defineProps<{
    tasks: Task[]
    viewAllTo: string
  }>()

  const emit = defineEmits<{
    'change-status': [task: Task]
    share: [task: Task]
  }>()

  const sortBy = ref<'nearest' | 'farthest' | 'status' | 'priority'>('nearest')

  const statusOrder: Record<string, number> = {
    'In progress': 0,
    'To do': 1,
    'Done': 2,
  }

  const priorityOrder: Record<string, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  }

  const sorted = computed(() => {
    const list = [...props.tasks]
    if (sortBy.value === 'nearest') {
      list.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    } else if (sortBy.value === 'farthest') {
      list.sort((a, b) => new Date(b.due).getTime() - new Date(a.due).getTime())
    } else if (sortBy.value === 'status') {
      list.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
    } else {
      list.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))
    }
    return list
  })

  const preview = computed(() => sorted.value.slice(0, 4))
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <CardTitle class="text-sm font-semibold text-headline">
            Tasks
          </CardTitle>
          <CardDescription class="mt-0.5 text-xs text-subline">
            Everything on your plate.
          </CardDescription>
        </div>

        <div class="flex items-center justify-start gap-2.5 shrink-0 pt-1 sm:pt-0">
          <Select v-model="sortBy">
            <SelectTrigger
              class="w-fit! h-7 gap-1.5 justify-start border-0! bg-transparent! p-0 text-xs font-medium text-subline shadow-none! ring-0! outline-none! hover:bg-transparent! hover:text-headline focus:ring-0 focus-visible:ring-0 focus-visible:border-0! focus-visible:outline-none data-[size=default]:h-7 [&>svg:last-child]:size-3 [&>svg:last-child]:opacity-100 [&>svg:last-child]:text-subline hover:[&>svg:last-child]:text-headline [&>svg:last-child]:transition-colors"
            >
              <ArrowUpDown class="size-3 shrink-0 text-current" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end" class="min-w-36">
              <SelectItem value="nearest" class="text-xs cursor-pointer">Earliest due</SelectItem>
              <SelectItem value="farthest" class="text-xs cursor-pointer">Latest due</SelectItem>
              <SelectItem value="status" class="text-xs cursor-pointer">By status</SelectItem>
              <SelectItem value="priority" class="text-xs cursor-pointer">By priority</SelectItem>
            </SelectContent>
          </Select>

          <div class="h-3.5 w-px shrink-0 bg-line" />

          <NuxtLink
            :to="viewAllTo"
            class="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-subline transition-colors hover:text-headline whitespace-nowrap"
          >
            <span>View all</span>
            <ArrowUpRight class="size-3.5 text-subline transition-transform group-hover:text-headline group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </NuxtLink>
        </div>
      </div>
    </CardHeader>

    <CardContent class="p-0">
      <DataTable
        :columns="overviewTasksColumns"
        :data="preview"
        :meta="{
          onChangeStatus: (t) => emit('change-status', t),
          onShare: (t) => emit('share', t),
        }"
      >
        <template #empty>
          <div class="px-5 py-12 text-center">
            <p class="text-sm font-medium text-text-strong">
              No tasks yet
            </p>
            <p class="mt-1 text-xs text-subline">
              Tasks you add will show up here.
            </p>
          </div>
        </template>
      </DataTable>
    </CardContent>
  </Card>
</template>