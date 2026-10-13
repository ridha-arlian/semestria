<script setup lang="ts">
  import { Plus, Search, Sparkles } from '@lucide/vue'
  import DataTable from '~/components/ui/data-table/DataTable.vue'
  import { materialsPageColumns } from '~/components/workspaces/materials/materials-page-columns.ts'
  import type { Material, MaterialType, ModalType } from '~/types'
  import type { Ref } from 'vue'

  definePageMeta({
    layout: 'workspaces',
    middleware: 'workspace',
  })

  interface WorkspaceContext {
    materials: Ref<Material[]>
    openAdd: (type: ModalType) => void
  }

  const { materials, openAdd } = inject<WorkspaceContext>('workspace')!

  const search = ref('')
  const typeFilter = ref<'All' | MaterialType>('All')

  const filtered = computed(() =>
    materials.value.filter(m =>
      [m.title, m.course, m.type, m.tags].join(' ').toLowerCase().includes(search.value.toLowerCase())
      && (typeFilter.value === 'All' || m.type === typeFilter.value),
    ),
  )

  const isSearching = computed(() => search.value.trim() !== '' || typeFilter.value !== 'All')
</script>

<template>
  <main class="mx-auto w-full max-w-330 px-5 py-7 md:px-9 md:py-9">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-subline">
          A flexible shelf for everything worth coming back to.
        </p>
        <Button class="w-full sm:w-auto" @click="openAdd('material')">
          <Plus class="mr-2 h-4 w-4" />
          Add material
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subline" />
          <Input
            v-model="search"
            class="bg-card pl-9"
            placeholder="Search materials..."
          />
        </div>
        <Select v-model="typeFilter">
          <SelectTrigger class="w-full sm:w-44">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="All" class="cursor-pointer text-xs">All types</SelectItem>
            <SelectItem value="Notes" class="cursor-pointer text-xs">Notes</SelectItem>
            <SelectItem value="Book" class="cursor-pointer text-xs">Book</SelectItem>
            <SelectItem value="Slides" class="cursor-pointer text-xs">Slides</SelectItem>
            <SelectItem value="Collection" class="cursor-pointer text-xs">Collection</SelectItem>
            <SelectItem value="Link" class="cursor-pointer text-xs">Link</SelectItem>
            <SelectItem value="PDF" class="cursor-pointer text-xs">PDF</SelectItem>
            <SelectItem value="Video" class="cursor-pointer text-xs">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card class="overflow-hidden">
        <CardContent class="p-0">
          <DataTable
            :columns="materialsPageColumns"
            :data="filtered"
            :mobile-hidden-columns="['course', 'type', 'tags', 'reviewed']"
            show-header
            :column-class="{
              course: 'w-44 shrink-0',
              type: 'w-32 shrink-0',
              tags: 'w-64 shrink-0',
              reviewed: 'w-36 shrink-0',
            }"
            empty-text="No materials found."
          >
            <template #empty>
              <div class="px-5 py-16 text-center">
                <Sparkles class="mx-auto size-5 text-subline/50" />
                <p class="mt-3 text-sm font-medium text-text-strong">
                  {{ isSearching ? 'No materials match your search' : 'No materials yet' }}
                </p>
                <p class="mt-1 text-xs text-subline">
                  {{ isSearching ? 'Try a different keyword or type filter.' : 'Add your first material to start your shelf.' }}
                </p>
              </div>
            </template>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
