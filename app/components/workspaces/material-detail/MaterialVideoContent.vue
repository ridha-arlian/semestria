<script setup lang="ts">
import { FileVideo, Link2 } from '@lucide/vue'
import type { Material } from '~/types'
import { materialContentSource } from '~/utils/materialContent'

const props = defineProps<{
  material: Material
}>()

const actualSource = computed(() => materialContentSource(props.material))
const source = computed(() => viewSource.value ?? actualSource.value)
const switchOpen = ref(false)
const pendingSource = ref<'file' | 'link' | null>(null)
// A switch is only a view change until the replacement is saved. Material.url
// still points at the old content, so pass a stripped copy to the new editor.
const viewSource = ref<'file' | 'link' | null>(null)
const viewMaterial = computed<Material>(() =>
  viewSource.value && viewSource.value !== actualSource.value
    ? { ...props.material, url: undefined, contentSource: viewSource.value }
    : props.material,
)

watch(() => props.material.id, () => {
  viewSource.value = null
  pendingSource.value = null
  switchOpen.value = false
})

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
  viewSource.value = next
  pendingSource.value = null
}

function confirmSwitch() {
  if (pendingSource.value)
    applySource(pendingSource.value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <WorkspacesMaterialDetailMaterialFileContent
      v-if="source === 'file'"
      :material="viewMaterial"
      type="Video"
    />
    <WorkspacesMaterialDetailMaterialLinkContent
      v-else
      :material="viewMaterial"
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
          The uploaded file will be removed when you save the new link.
        </template>
        <template v-else>
          The current link will be removed when you upload a new file.
        </template>
      </template>
    </ConfirmDialog>
  </div>
</template>
