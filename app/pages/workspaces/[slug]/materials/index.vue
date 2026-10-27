<script setup lang="ts">
  import { ArrowUpRight, Check, FileText, Plus, Search, Sparkles, Trash2, X } from '@lucide/vue'
  import DataTable from '~/components/ui/data-table/DataTable.vue'
  import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
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
    markMaterialReviewed: (id: number) => void
    removeMaterial: (id: number) => void
  }

  const { materials, openAdd, markMaterialReviewed, removeMaterial } = inject<WorkspaceContext>('workspace')!

  const route = useRoute()
  const router = useRouter()
  const slug = computed(() => route.params.slug as string)

  const search = ref('')
  const typeFilter = ref<'All' | MaterialType>('All')

  const courseQuery = computed(() => typeof route.query.course === 'string' ? route.query.course : '')
  const tagQuery = computed(() => typeof route.query.tag === 'string' ? route.query.tag : '')

  function handleRowClick(item: Material) {
    navigateTo(`/workspaces/${slug.value}/materials/${item.id}`)
  }

  function handleOpenLink(item: Material) {
    if (item.type === 'Collection') {
      handleRowClick(item)
      return
    }
    if (item.url)
      window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  const menuDeleteTarget = ref<Material | null>(null)

  function askDeleteMaterial(item: Material) {
    menuDeleteTarget.value = item
  }

  function confirmDeleteMaterial() {
    if (!menuDeleteTarget.value)
      return
    removeMaterial(menuDeleteTarget.value.id)
    menuDeleteTarget.value = null
  }

  function clearQueryFilter(key: 'course' | 'tag') {
    const { [key]: _removed, ...query } = route.query
    router.replace({ query })
  }

  const filtered = computed(() =>
    materials.value.filter(m =>
      [m.title, m.course, m.type, m.tags].join(' ').toLowerCase().includes(search.value.toLowerCase())
      && (typeFilter.value === 'All' || m.type === typeFilter.value)
      && (!courseQuery.value || m.course === courseQuery.value)
      && (!tagQuery.value || m.tags.split(',').map(t => t.trim().toLowerCase()).includes(tagQuery.value.toLowerCase())),
    ),
  )

  const isSearching = computed(() => search.value.trim() !== '' || typeFilter.value !== 'All' || !!courseQuery.value || !!tagQuery.value)
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

      <div v-if="courseQuery || tagQuery" class="flex flex-wrap items-center gap-2">
        <Badge v-if="courseQuery" variant="secondary" class="gap-1 py-1 pl-2.5 pr-1 text-[11px]">
          Course: {{ courseQuery }}
          <button type="button" class="rounded-sm p-0.5 hover:text-foreground" aria-label="Clear course filter" @click="clearQueryFilter('course')">
            <X class="size-3" />
          </button>
        </Badge>
        <Badge v-if="tagQuery" variant="secondary" class="gap-1 py-1 pl-2.5 pr-1 font-mono text-[11px]">
          #{{ tagQuery }}
          <button type="button" class="rounded-sm p-0.5 hover:text-foreground" aria-label="Clear tag filter" @click="clearQueryFilter('tag')">
            <X class="size-3" />
          </button>
        </Badge>
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
            :meta="{
              onOpenLink: (m) => handleOpenLink(m),
              onMarkReviewed: (m) => markMaterialReviewed(m.id),
              onDelete: (m) => askDeleteMaterial(m),
            }"
            @row-click="handleRowClick"
          >
            <template #context-menu="{ row }">
              <ContextMenuItem class="cursor-pointer text-xs" @select="handleRowClick(row)">
                <FileText class="mr-2 size-3.5 text-subline" /> Open material
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem v-if="row.url || row.links?.length" class="cursor-pointer text-xs" @select="handleOpenLink(row)">
                <ArrowUpRight class="mr-2 size-3.5 text-subline" /> Open content
              </ContextMenuItem>
              <ContextMenuItem class="cursor-pointer text-xs" @select="markMaterialReviewed(row.id)">
                <Check class="mr-2 size-3.5 text-subline" /> Mark reviewed
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem class="cursor-pointer text-xs text-destructive focus:text-destructive" @select="askDeleteMaterial(row)">
                <Trash2 class="mr-2 size-3.5" /> Delete
              </ContextMenuItem>
            </template>
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

      <DeleteConfirmDialog
        :open="!!menuDeleteTarget"
        title="Delete this material?"
        confirm-label="Delete material"
        @update:open="(v: boolean) => { if (!v) menuDeleteTarget = null }"
        @confirm="confirmDeleteMaterial"
      >
        <template #description>
          Are you sure you want to delete <strong class="font-semibold text-destructive">"{{ menuDeleteTarget?.title }}"</strong>? This action can't be undone. Linked tasks will be kept, but the link to this material will be removed.
        </template>
      </DeleteConfirmDialog>
    </div>
  </main>
</template>
