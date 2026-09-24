<script setup lang="ts">
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
    <CardHeader class="border-b border-line">
      <div class="flex items-center justify-between gap-3">
        <div>
          <CardTitle class="text-sm font-semibold text-headline">
            Upcoming assignments
          </CardTitle>
          <CardDescription class="mt-0.5 text-xs text-subline">
            Your next deadlines at a glance.
          </CardDescription>
        </div>

        <div class="flex items-center gap-2.5">
          <Select v-model="sortBy">
            <SelectTrigger
              class="flex h-auto items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-subline shadow-none hover:bg-transparent hover:text-headline focus:outline-none focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:size-3"
            >
              <ArrowUpDown class="size-3" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="nearest" class="text-xs">Earliest due</SelectItem>
              <SelectItem value="farthest" class="text-xs">Latest due</SelectItem>
              <SelectItem value="status" class="text-xs">By status</SelectItem>
              <SelectItem value="priority" class="text-xs">By priority</SelectItem>
            </SelectContent>
          </Select>

          <div class="h-3 w-px bg-line" />

          <NuxtLink
            to="/assignments"
            class="flex items-center text-xs font-medium text-subline hover:text-headline"
          >
            View all
            <ArrowUpRight class="ml-1 size-3" />
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