<script setup lang="ts">
import { Bold, Heading1, Heading2, Italic, Link2, List, ListOrdered, Pencil, Quote, Redo2, Undo2 } from '@lucide/vue'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import type { Material, MaterialNote } from '~/types'
import type { MaterialDetailContext } from './materialDetailContext.ts'

const props = defineProps<{
  material: Material
}>()

const ctx = inject<MaterialDetailContext>('workspace')!

// --- Notes (TipTap rich editor with explicit Save + read-only preview) ---
const savedNote = ref<MaterialNote>(props.material.description ?? '')
const savedKey = ref('')
const noteRev = ref(0)
const noteMode = ref<'edit' | 'preview'>('edit')

function noteKey(note: MaterialNote | undefined) {
  return JSON.stringify(note ?? '')
}

const linkOpen = ref(false)
const linkUrl = ref('')

function openLinkPopover() {
  const ed = editor.value
  if (!ed)
    return
  const href = ed.getAttributes('link').href
  linkUrl.value = typeof href === 'string' ? href : ''
  linkOpen.value = true
}

function onLinkOpenChange(open: boolean) {
  linkOpen.value = open
  // Prefill from the current selection whenever the panel opens.
  if (open) {
    const ed = editor.value
    const href = ed?.getAttributes('link').href
    linkUrl.value = typeof href === 'string' ? href : ''
  }
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https'],
      },
    }),
    Placeholder.configure({ placeholder: 'Write notes…' }),
  ],
  content: props.material.description ?? '',
  editorProps: {
    attributes: {
      'aria-label': 'Notes',
    },
    handleKeyDown: (_view, event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.shiftKey) {
        openLinkPopover()
        return true
      }
      return false
    },
  },
  onCreate: () => loadNote(),
  onUpdate: () => {
    noteRev.value++
  },
  onSelectionUpdate: () => {
    noteRev.value++
  },
})

function loadNote() {
  const ed = editor.value
  if (!ed)
    return
  const incoming = props.material.description ?? ''
  savedNote.value = incoming
  ed.commands.setContent(incoming, { emitUpdate: false })
  savedKey.value = noteKey(ed.getJSON())
  noteRev.value++
  noteMode.value = ed.isEmpty ? 'edit' : 'preview'
}

watch(() => props.material.id, () => loadNote())

const noteDirty = computed(() => {
  void noteRev.value
  const ed = editor.value
  return !!ed && noteKey(ed.getJSON()) !== savedKey.value
})

function saveNote() {
  const ed = editor.value
  if (!ed || !noteDirty.value)
    return
  const note: MaterialNote = ed.isEmpty ? '' : ed.getJSON()
  ctx.updateMaterialNote(props.material.id, note)
  savedNote.value = note
  savedKey.value = noteKey(ed.getJSON())
  noteMode.value = 'preview'
}

function cancelNote() {
  revertNote()
  noteMode.value = 'preview'
}

function editNotes() {
  noteMode.value = 'edit'
  nextTick(() => editor.value?.commands.focus('end'))
}

const isEditorEmpty = computed(() => {
  void noteRev.value
  return editor.value?.isEmpty ?? true
})

watch(noteMode, (mode) => {
  const ed = editor.value
  if (!ed)
    return
  if (mode === 'preview') {
    ed.commands.blur()
    ed.setEditable(false)
  }
  else {
    ed.setEditable(true)
  }
})

function revertNote() {
  const ed = editor.value
  if (!ed)
    return
  ed.commands.setContent(savedNote.value, { emitUpdate: false })
  savedKey.value = noteKey(ed.getJSON())
  noteRev.value++
}

function applyLink() {
  const ed = editor.value
  if (!ed)
    return
  const raw = linkUrl.value.trim()
  if (!raw) {
    if (ed.isActive('link'))
      ed.chain().focus().extendMarkRange('link').unsetLink().run()
    else
      ed.chain().focus().unsetLink().run()
    linkOpen.value = false
    return
  }
  const href = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  if (ed.isActive('link'))
    ed.chain().focus().extendMarkRange('link').setLink({ href }).run()
  else
    ed.chain().focus().setLink({ href }).run()
  linkOpen.value = false
}

function removeLink() {
  const ed = editor.value
  if (!ed)
    return
  if (ed.isActive('link'))
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
  else
    ed.chain().focus().unsetLink().run()
  linkOpen.value = false
}

const noteTools = computed(() => {
  void noteRev.value
  const ed = editor.value
  if (!ed)
    return []
  return [
    { id: 'h1', label: 'Heading 1', icon: Heading1, active: ed.isActive('heading', { level: 1 }), run: () => ed.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2', label: 'Heading 2', icon: Heading2, active: ed.isActive('heading', { level: 2 }), run: () => ed.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'quote', label: 'Quote', icon: Quote, active: ed.isActive('blockquote'), run: () => ed.chain().focus().toggleBlockquote().run() },
    { id: 'bold', label: 'Bold (Ctrl+B)', icon: Bold, active: ed.isActive('bold'), run: () => ed.chain().focus().toggleBold().run() },
    { id: 'italic', label: 'Italic (Ctrl+I)', icon: Italic, active: ed.isActive('italic'), run: () => ed.chain().focus().toggleItalic().run() },
    { id: 'ul', label: 'Bulleted list', icon: List, active: ed.isActive('bulletList'), run: () => ed.chain().focus().toggleBulletList().run() },
    { id: 'ol', label: 'Numbered list', icon: ListOrdered, active: ed.isActive('orderedList'), run: () => ed.chain().focus().toggleOrderedList().run() },
  ]
})

const canUndo = computed(() => {
  void noteRev.value
  return editor.value?.can().undo() ?? false
})

const canRedo = computed(() => {
  void noteRev.value
  return editor.value?.can().redo() ?? false
})
</script>

<template>
  <!-- Notes -->
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <Label class="text-xs font-medium">Notes</Label>
      <div v-if="editor && noteMode === 'edit'" class="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" :disabled="!noteDirty" @click="cancelNote">
          Cancel
        </Button>
        <Button size="sm" :disabled="!noteDirty" @click="saveNote">
          Save
        </Button>
      </div>
      <Button v-else-if="editor" size="sm" variant="outline" @click="editNotes">
        <Pencil class="size-3.5 sm:mr-2" />
        <span class="max-sm:hidden">Edit notes</span>
      </Button>
    </div>
    <div class="overflow-hidden rounded-md border border-line" @keydown.escape="noteMode === 'edit' && revertNote()">
      <div v-if="editor && noteMode === 'edit'" class="flex flex-wrap items-center gap-0.5 border-b border-line bg-soft/40 p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-7 text-subline hover:text-ink"
          :disabled="!canUndo"
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          @click="editor?.chain().focus().undo().run()"
        >
          <Undo2 class="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-7 text-subline hover:text-ink"
          :disabled="!canRedo"
          aria-label="Redo (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
          @click="editor?.chain().focus().redo().run()"
        >
          <Redo2 class="size-3.5" />
        </Button>
        <span class="mx-1 h-4 w-px bg-line" />
        <Button
          v-for="tool in noteTools"
          :key="tool.id"
          type="button"
          variant="ghost"
          size="icon"
          class="size-7"
          :class="tool.active ? 'bg-line text-text-strong' : 'text-subline hover:text-ink'"
          :aria-label="tool.label"
          :title="tool.label"
          @click="tool.run()"
        >
          <component :is="tool.icon" class="size-3.5" />
        </Button>
        <span class="mx-1 h-4 w-px bg-line" />
        <Popover :open="linkOpen" @update:open="onLinkOpenChange">
          <PopoverTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="size-7"
              :class="editor?.isActive('link') ? 'bg-line text-text-strong' : 'text-subline hover:text-ink'"
              aria-label="Link (Ctrl+K)"
              title="Link (Ctrl+K)"
            >
              <Link2 class="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" class="w-64 space-y-2 p-2">
            <Label for="note-link-url" class="text-xs">Link URL</Label>
            <Input
              id="note-link-url"
              v-model="linkUrl"
              placeholder="https://…"
              class="h-8 text-sm"
              @keydown.enter.prevent="applyLink"
              @keydown.escape="linkOpen = false"
            />
            <div class="flex items-center justify-between gap-2">
              <Button size="sm" variant="ghost" class="text-destructive hover:text-destructive" @click="removeLink">
                Remove
              </Button>
              <div class="flex gap-1.5">
                <Button size="sm" variant="ghost" @click="linkOpen = false">
                  Cancel
                </Button>
                <Button size="sm" @click="applyLink">
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <EditorContent
        v-if="!(noteMode === 'preview' && isEditorEmpty)"
        :editor="editor"
        class="notes-editor"
        :class="noteMode === 'preview' && 'notes-preview'"
      />
      <p v-else class="flex min-h-11 items-start px-3 py-2 text-sm text-subline">
        No notes yet.
      </p>
    </div>
  </div>
</template>
