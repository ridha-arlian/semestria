<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ArrowUpRight, ArrowUpDown } from '@lucide/vue'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import DataTable from '~/components/ui/data-table/DataTable.vue'
  import { assignmentColumns } from '~/components/workspaces/assignment-columns.ts'
  import type { Assignment } from '~/types/dashboard'

  const props = defineProps<{
    assignments: Assignment[]
  }>()

  const emit = defineEmits<{
    'change-status': [assignment: Assignment]
    share: [assignment: Assignment]
  }>()

  const sortBy = ref<'nearest' | 'farthest' | 'status' | 'priority'>('nearest')

  const statusOrder: Record<string, number> = {
    'In progress': 0,
    'Not started': 1,
    'Done': 2,
  }

  const priorityOrder: Record<string, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  }

  const sorted = computed(() => {
    const list = [...props.assignments]
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
    <CardHeader class="border-b border-line px-4 py-3 sm:px-6 sm:py-4">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <CardTitle class="text-sm font-semibold text-headline">
            Upcoming assignments
          </CardTitle>
          <CardDescription class="mt-0.5 text-xs text-subline">
            Your next deadlines at a glance.
          </CardDescription>
        </div>

        <div class="flex items-center justify-start gap-2.5 shrink-0 pt-1 sm:pt-0">
          <Select v-model="sortBy">
            <SelectTrigger
              class="flex h-7 items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-medium text-subline shadow-none hover:bg-transparent hover:text-headline focus:outline-none focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:size-3"
            >
              <ArrowUpDown class="size-3 shrink-0" />
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
            to="/assignments"
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
        :columns="assignmentColumns"
        :data="preview"
        :meta="{
          onChangeStatus: (a) => emit('change-status', a),
          onShare: (a) => emit('share', a),
        }"
      />
    </CardContent>
  </Card>
</template>