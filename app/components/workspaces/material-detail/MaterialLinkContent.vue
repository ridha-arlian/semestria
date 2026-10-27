<script setup lang="ts">
import { Check, Link2, Pencil, Plus, X } from '@lucide/vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'
import { normalizeUrl } from '~/utils/materialContent'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const editing = ref(false)
const draft = ref('')
const error = ref<string | null>(null)
const removeOpen = ref(false)
const inputEl = ref<{ $el?: HTMLInputElement } | null>(null)

const hasLink = computed(() => !!props.material.url)

function focusInput() {
  nextTick(() => inputEl.value?.$el?.focus())
}

function startEdit() {
  draft.value = props.material.url ?? ''
  error.value = null
  editing.value = true
  focusInput()
}

function cancelEdit() {
  editing.value = false
  draft.value = ''
  error.value = null
}

function save() {
  const result = normalizeUrl(draft.value)
  if ('error' in result) {
    error.value = result.error
    return
  }
  ctx.setMaterialContent(props.material.id, { url: result.url, source: 'link' })
  cancelEdit()
}

function openLink() {
  if (!props.material.url)
    return
  ctx.markMaterialOpened(props.material.id)
  window.open(props.material.url, '_blank', 'noopener,noreferrer')
}

function removeLink() {
  ctx.setMaterialContent(props.material.id, null)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Existing link -->
    <div
      v-if="hasLink && !editing"
      class="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-soft/80"
      role="link"
      tabindex="0"
      :aria-label="material.url"
      @click="openLink"
      @keydown.enter.prevent="openLink"
    >
      <Link2 class="size-3.5 shrink-0 text-subline" />
      <span class="min-w-0 flex-1 truncate font-mono text-xs text-text-strong">
        {{ material.url }}
      </span>
      <div class="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-subline opacity-0 transition-opacity hover:text-headline group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
          aria-label="Edit link"
          title="Edit link"
          @click.stop="startEdit"
        >
          <Pencil class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-subline opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
          aria-label="Remove link"
          title="Remove link"
          @click.stop="removeOpen = true"
        >
          <X class="size-3.5" />
        </Button>
      </div>
    </div>

    <!-- Add / edit -->
    <div v-else class="space-y-2">
      <div class="flex items-center gap-2">
        <Input
          ref="inputEl"
          v-model="draft"
          type="url"
          class="h-8 font-mono text-xs"
          placeholder="https://…"
          @keydown.enter.prevent="save"
          @keydown.escape.prevent="hasLink ? cancelEdit() : undefined"
        />
        <Button
          v-if="editing"
          size="sm"
          variant="ghost"
          class="shrink-0"
          @click="cancelEdit"
        >
          Cancel
        </Button>
        <Button
          size="icon-sm"
          class="shrink-0"
          :disabled="!draft.trim()"
          :aria-label="hasLink ? 'Save link' : 'Add link'"
          :title="hasLink ? 'Save link' : 'Add link'"
          @click="save"
        >
          <Check v-if="editing" class="size-4" />
          <Plus v-else class="size-4" />
        </Button>
      </div>
      <p v-if="error" class="px-1 text-[11px] text-destructive">
        {{ error }}
      </p>
    </div>

    <ConfirmDialog
      v-model:open="removeOpen"
      title="Remove this link?"
      confirm-label="Remove"
      @confirm="removeLink"
    >
      <template #description>
        The link will be detached from this material. You can add it again later.
      </template>
    </ConfirmDialog>
  </div>
</template>
