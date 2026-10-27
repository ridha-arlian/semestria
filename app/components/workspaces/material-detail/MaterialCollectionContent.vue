<script setup lang="ts">
import { Plus } from '@lucide/vue'
import type { Material, MaterialLink } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'
import { comparableUrl, normalizeUrl } from '~/utils/materialContent'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const links = computed(() => props.material.links ?? [])
const showAdd = ref(links.value.length === 0)
const newUrl = ref('')
const newLabel = ref('')
const newError = ref<string | null>(null)
const newUrlEl = ref<{ $el?: HTMLInputElement } | null>(null)

const editingId = ref<number | null>(null)

watch(() => props.material.id, () => {
  showAdd.value = links.value.length === 0
  cancelAdd()
  editingId.value = null
})

function isDuplicate(url: string, exceptId?: number) {
  const target = comparableUrl(url)
  return links.value.some(link => link.id !== exceptId && comparableUrl(link.url) === target)
}

function startAdd() {
  showAdd.value = true
  newError.value = null
  nextTick(() => newUrlEl.value?.$el?.focus())
}

function cancelAdd() {
  newUrl.value = ''
  newLabel.value = ''
  newError.value = null
  showAdd.value = links.value.length === 0
}

function addLink() {
  const result = normalizeUrl(newUrl.value)
  if ('error' in result) {
    newError.value = result.error
    return
  }
  if (isDuplicate(result.url)) {
    newError.value = 'That link is already in this collection.'
    return
  }
  ctx.addMaterialLink(props.material.id, {
    url: result.url,
    label: newLabel.value.trim() || undefined,
  })
  newUrl.value = ''
  newLabel.value = ''
  newError.value = null
  showAdd.value = false
}

function startEdit(link: MaterialLink) {
  editingId.value = link.id
}
</script>

<template>
  <div class="space-y-1">
    <p v-if="links.length === 0 && showAdd" class="px-2 pb-1 text-center text-xs text-subline">
      No links yet. Add the first reference link.
    </p>

    <WorkspacesMaterialDetailMaterialLinkRow
      v-for="entry in links"
      :key="entry.id"
      :link="entry"
      :links="links"
      :material-id="props.material.id"
      :editing="editingId === entry.id"
      @saved="editingId = null"
      @canceled="editingId = null"
      @edit="startEdit(entry)"
    />

    <!-- Add form -->
    <div v-if="showAdd" class="space-y-2 border-t border-line pt-3">
      <Input
        v-model="newLabel"
        class="h-8 text-xs"
        placeholder="Label (optional)"
        @keydown.escape.prevent="cancelAdd"
      />
      <div class="flex items-center gap-2">
        <Input
          ref="newUrlEl"
          v-model="newUrl"
          type="url"
          class="h-8 font-mono text-xs"
          placeholder="https://…"
          @keydown.enter.prevent="addLink"
          @keydown.escape.prevent="cancelAdd"
        />
        <Button
          size="icon-sm"
          class="shrink-0"
          :disabled="!newUrl.trim()"
          aria-label="Add link"
          title="Add link"
          @click="addLink"
        >
          <Plus class="size-4" />
        </Button>
      </div>
      <p v-if="newError" class="text-[11px] text-destructive">
        {{ newError }}
      </p>
      <div v-if="links.length > 0" class="flex justify-end">
        <Button size="sm" variant="ghost" @click="cancelAdd">
          Cancel
        </Button>
      </div>
    </div>

    <Button
      v-else
      size="sm"
      variant="ghost"
      class="-ml-2 gap-1 text-xs text-muted-foreground"
      @click="startAdd"
    >
      <Plus class="size-3.5" />
      Add link
    </Button>
  </div>
</template>
