/**
 * Shared inline-edit state machine for single-line row editing
 * (checklist items, submission links, ...).
 *
 * Owns: which row is being edited, the draft text, autofocus of the
 * edit input, and the trim-guarded save/cancel transitions.
 * Callers only provide the input's template-ref key and what
 * "save" means for their data.
 */
export function useInlineEdit(
  inputRefKey: string,
  onSave: (id: number, value: string) => void,
) {
  const editingId = ref<number | null>(null)
  const draft = ref('')
  const inputRef = useTemplateRef<unknown>(inputRefKey)

  function focusInput() {
    nextTick(() => {
      const el = inputRef.value as unknown as { $el?: HTMLInputElement } | null
      el?.$el?.focus()
    })
  }

  function start(id: number, initial: string) {
    editingId.value = id
    draft.value = initial
    focusInput()
  }

  function save() {
    if (editingId.value !== null && draft.value.trim())
      onSave(editingId.value, draft.value)
    editingId.value = null
    draft.value = ''
  }

  function cancel() {
    editingId.value = null
    draft.value = ''
  }

  const isEditing = computed(() => editingId.value !== null)

  return { editingId, draft, isEditing, start, save, cancel }
}
