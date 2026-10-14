<script setup lang="ts">
import type { Material } from '~/types'

const props = defineProps<{
  material: Material
}>()

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const listPath = computed(() => `/workspaces/${slug.value}/materials`)

const tags = computed(() =>
  props.material.tags.split(',').map(t => t.trim()).filter(Boolean),
)

function filterByCourse() {
  navigateTo({ path: listPath.value, query: { course: props.material.course } })
}

function filterByTag(tag: string) {
  navigateTo({ path: listPath.value, query: { tag } })
}
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Details
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3.5 p-4">
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="shrink-0 text-xs text-subline">Course</span>
        <button
          type="button"
          class="min-w-0 truncate text-right text-xs font-medium text-text-strong underline-offset-2 hover:underline"
          :title="`Filter by ${material.course}`"
          @click="filterByCourse"
        >
          {{ material.course }}
        </button>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="shrink-0 text-xs text-subline">Type</span>
        <Badge variant="outline" class="px-2 py-0.5 text-[10px] font-normal text-subline">
          {{ material.type }}
        </Badge>
      </div>
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="shrink-0 text-xs text-subline">Tags</span>
        <div v-if="tags.length" class="flex min-w-0 flex-wrap justify-end gap-1">
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            :title="`Filter by #${tag}`"
            class="max-w-28 truncate rounded border border-line px-1.5 py-0 font-mono text-[10px] font-normal text-subline transition-colors hover:border-ink/30 hover:text-ink"
            @click="filterByTag(tag)"
          >
            #{{ tag }}
          </button>
        </div>
        <span v-else class="text-xs text-text-muted">—</span>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="shrink-0 text-xs text-subline">Last reviewed</span>
        <span class="text-xs text-text-strong">{{ material.reviewed }}</span>
      </div>
    </CardContent>
  </Card>
</template>
