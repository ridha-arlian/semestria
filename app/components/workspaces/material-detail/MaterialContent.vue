<script setup lang="ts">
import type { Material } from '~/types'
import { MATERIAL_TYPE_DESCRIPTIONS } from '~/utils/materialContent'

const props = defineProps<{
  material: Material
}>()

const description = computed(() => MATERIAL_TYPE_DESCRIPTIONS[props.material.type])
const hasContent = computed(() => props.material.type !== 'Notes')
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="border-b border-line">
      <CardTitle class="text-sm font-semibold text-headline">
        Content
      </CardTitle>
      <CardDescription class="mt-0.5 text-xs text-subline">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-5 p-4 sm:p-5">
      <template v-if="hasContent">
        <WorkspacesMaterialDetailMaterialFileContent
          v-if="material.type === 'PDF' || material.type === 'Slides' || material.type === 'Book'"
          :material="material"
          :type="material.type === 'Slides' ? 'Slides' : material.type === 'Book' ? 'Book' : 'PDF'"
        />
        <WorkspacesMaterialDetailMaterialVideoContent
          v-else-if="material.type === 'Video'"
          :material="material"
        />
        <WorkspacesMaterialDetailMaterialLinkContent
          v-else-if="material.type === 'Link'"
          :material="material"
        />
        <WorkspacesMaterialDetailMaterialCollectionContent
          v-else-if="material.type === 'Collection'"
          :material="material"
        />

        <Separator />
      </template>

      <WorkspacesMaterialDetailMaterialNotes :material="material" />
    </CardContent>
  </Card>
</template>
