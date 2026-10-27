<script setup lang="ts">
import { FileVideo, Link2 } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'
import { materialContentSource } from '~/utils/materialContent'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const source = computed(() => materialContentSource(props.material))
const switchOpen = ref(false)
const pendingSource = ref<'file' | 'link' | null>(null)

function requestSource(next: 'file' | 'link') {
  if (next === source.value)
    return
  if (props.material.url) {
    pendingSource.value = next
    switchOpen.value = true
    return
  }
  applySource(next)
}

function applySource(next: 'file' | 'link') {
  ctx.setMaterialContent(props.material.id, { url: '', source: next })
  pendingSource.value = null
}

function confirmSwitch() {
  if (pendingSource.value)
    applySource(pendingSource.value)
}
</script>

<template>
  <div class="space-y-2">
    <WorkspacesMaterialDetailMaterialFileContent
      v-if="source === 'file'"
      :material="material"
      type="Video"
    />
    <WorkspacesMaterialDetailMaterialLinkContent
      v-else
      :material="material"
    />

    <div class="flex justify-start">
      <Button
        variant="ghost"
        size="sm"
        class="-ml-2 gap-1 text-xs text-muted-foreground"
        @click="requestSource(source === 'file' ? 'link' : 'file')"
      >
        <Link2 v-if="source === 'file'" class="size-3.5" />
        <FileVideo v-else class="size-3.5" />
        {{ source === 'file' ? 'Use a link instead' : 'Use a file instead' }}
      </Button>
    </div>

    <ConfirmDialog
      v-model:open="switchOpen"
      :title="pendingSource === 'link' ? 'Replace this file with a link?' : 'Replace this link with a file?'"
      confirm-label="Switch"
      @confirm="confirmSwitch"
      @close="pendingSource = null"
    >
      <template #description>
        <template v-if="pendingSource === 'link'">
          The uploaded file will be removed. You can upload it again later.
        </template>
        <template v-else>
          The current link will be removed. You can add it again later.
        </template>
      </template>
    </ConfirmDialog>
  </div>
</template>
