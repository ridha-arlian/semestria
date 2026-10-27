<script setup lang="ts">
import { Link2, Pencil, X } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import type { MaterialLink } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'
import { comparableUrl, normalizeUrl } from '~/utils/materialContent'

const props = defineProps<{
  link: MaterialLink
  links: MaterialLink[]
  materialId: number
  editing: boolean
}>()

const emit = defineEmits<{
  saved: []
  canceled: []
  edit: []
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

const draftUrl = ref(props.link.url)
const draftLabel = ref(props.link.label ?? '')
const error = ref<string | null>(null)
const urlEl = ref<{ $el?: HTMLInputElement } | null>(null)

watch(() => props.editing, (editing) => {
  if (editing) {
    draftUrl.value = props.link.url
    draftLabel.value = props.link.label ?? ''
    error.value = null
    nextTick(() => urlEl.value?.$el?.focus())
  }
})

function isDuplicate(url: string) {
  const target = comparableUrl(url)
  return props.links.some(l => l.id !== props.link.id && comparableUrl(l.url) === target)
}

function save() {
  const result = normalizeUrl(draftUrl.value)
  if ('error' in result) {
    error.value = result.error
    return
  }
  if (isDuplicate(result.url)) {
    error.value = 'That link is already in this collection.'
    return
  }
  ctx.updateMaterialLink(props.materialId, props.link.id, {
    url: result.url,
    label: draftLabel.value.trim() || undefined,
  })
  emit('saved')
}

function cancel() {
  emit('canceled')
}

function remove() {
  ctx.removeMaterialLink(props.materialId, props.link.id)
}

function open() {
  ctx.markMaterialOpened(props.materialId)
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div v-if="editing" class="space-y-2 rounded-md bg-soft/40 p-3">
    <Input
      v-model="draftLabel"
      class="h-8 text-xs"
      placeholder="Label (optional)"
      @keydown.escape.prevent="cancel"
    />
    <Input
      ref="urlEl"
      v-model="draftUrl"
      type="url"
      class="h-8 font-mono text-xs"
      placeholder="https://…"
      @keydown.enter.prevent="save"
      @keydown.escape.prevent="cancel"
    />
    <div class="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="ghost" @click="cancel">
        Cancel
      </Button>
      <Button size="sm" :disabled="!draftUrl.trim()" @click="save">
        Save
      </Button>
    </div>
    <p v-if="error" class="text-[11px] text-destructive">
      {{ error }}
    </p>
  </div>

  <div
    v-else
    class="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-soft/80"
    role="link"
    tabindex="0"
    :aria-label="link.label || link.url"
    @click="open"
    @keydown.enter.prevent="open"
  >
    <Link2 class="size-3.5 shrink-0 text-subline" />
    <span class="min-w-0 flex-1">
      <span v-if="link.label" class="block truncate text-xs font-semibold text-text-strong">
        {{ link.label }}
      </span>
      <span
        class="block truncate font-mono"
        :class="link.label ? 'text-[11px] text-subline' : 'text-xs text-text-strong'"
      >
        {{ link.url }}
      </span>
    </span>
    <div class="flex shrink-0 items-center">
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-subline opacity-0 transition-opacity hover:text-headline group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
        :aria-label="`Edit ${link.label || link.url}`"
        title="Edit link"
        @click.stop="$emit('edit')"
      >
        <Pencil class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="size-7 text-subline opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
        :aria-label="`Remove ${link.label || link.url}`"
        title="Remove link"
        @click.stop="remove"
      >
        <X class="size-3.5" />
      </Button>
    </div>
  </div>
</template>
