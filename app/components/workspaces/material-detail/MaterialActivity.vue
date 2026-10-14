<script setup lang="ts">
import { History } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const expanded = ref(false)
const PAGE_SIZE = 5

const activities = computed(() => ctx.getMaterialActivities(props.material))
const visible = computed(() => expanded.value ? activities.value : activities.value.slice(0, PAGE_SIZE))
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <div class="flex items-center justify-between gap-2">
        <CardTitle class="flex items-center gap-2 text-sm font-semibold text-headline">
          <History class="size-4 text-subline" />
          Activity
        </CardTitle>
        <button
          v-if="activities.length > PAGE_SIZE"
          type="button"
          class="text-xs font-medium text-text-strong underline-offset-2 hover:underline"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Show less' : 'View all' }}
        </button>
      </div>
    </CardHeader>
    <CardContent class="p-4">
      <ol v-if="activities.length > 0" class="relative space-y-4 border-l border-line pl-4">
        <li v-for="a in visible" :key="a.id" class="relative">
          <span class="absolute -left-[21px] top-1 size-2 rounded-full border border-line bg-card" />
          <p class="text-xs font-medium text-text-strong">
            {{ a.label }}
          </p>
          <p v-if="a.detail" class="mt-0.5 truncate text-[11px] text-subline" :title="a.detail">
            {{ a.detail }}
          </p>
          <p class="mt-0.5 text-[11px] text-text-muted">
            {{ a.at }}
          </p>
        </li>
      </ol>
      <p v-else class="py-2 text-center text-xs text-subline">
        No activity yet.
      </p>
    </CardContent>
  </Card>
</template>
