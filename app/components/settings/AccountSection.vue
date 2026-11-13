<script setup lang="ts">
const api = useApi()
const { settings } = useSettings()

const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const confirmEmail = ref('')

const email = computed(() => settings.value.profile.email)
const emailMatches = computed(() => confirmEmail.value.trim().toLowerCase() === email.value.trim().toLowerCase())
// Only flag a mismatch once the person has typed something, so the field does
// not open already in an error state.
const mismatch = computed(() => confirmEmail.value.length > 0 && !emailMatches.value)

// Closing the dialog abandons the typed confirmation instead of keeping it
// around for the next attempt.
watch(deleteOpen, (open) => {
  if (open)
    return
  confirmEmail.value = ''
  deleteError.value = null
})

async function deleteAccount() {
  if (!emailMatches.value || deleting.value)
    return
  deleting.value = true
  deleteError.value = null
  try {
    await api.request('/api/me', { method: 'DELETE', authRedirect: false })
    // Full reload drops every client cache and the in-memory session state.
    window.location.href = '/'
  }
  catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Could not delete your account.'
    deleting.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
    <h3 class="text-sm font-semibold text-headline">
      Danger zone
    </h3>
    <p class="mt-1 text-xs leading-relaxed text-subline">
      Permanently delete your account and all your data, including workspaces, tasks, materials, notes, and uploaded files. This can't be undone.
    </p>
    <Button
      variant="destructive"
      size="sm"
      class="mt-3 text-xs"
      @click="deleteOpen = true"
    >
      Delete account
    </Button>

    <Dialog v-model:open="deleteOpen">
      <DialogContent
        :show-close-button="false"
        class="max-h-[calc(100dvh-2rem)] max-w-md gap-4 overflow-y-auto p-5 sm:p-6"
      >
        <div class="flex flex-col gap-2">
          <DialogTitle class="text-lg font-semibold text-headline">
            Delete your account?
          </DialogTitle>
          <DialogDescription class="text-sm leading-relaxed text-subline">
            This permanently deletes your account and everything in it, including workspaces, tasks, notes, and uploaded files. This can't be undone.
          </DialogDescription>
          <p class="text-xs leading-relaxed text-subline/80">
            Backup copies may remain for up to 30 days before they're fully removed. You'll be signed out immediately.
          </p>
        </div>

        <FieldGroup class="gap-4">
          <Field class="gap-1.5" :data-invalid="mismatch">
            <FieldLabel
              for="delete-confirm-email"
              class="flex-col items-center gap-1 text-center text-sm leading-relaxed sm:flex-row sm:items-center sm:gap-1.5 sm:text-left"
            >
              <span class="sm:hidden">Type this email to confirm account deletion:</span>
              <span class="hidden sm:inline">Type</span>
              <span class="block w-full break-all font-semibold text-destructive sm:inline sm:w-auto">{{ email }}</span>
              <span class="hidden sm:inline">to confirm account deletion</span>
            </FieldLabel>
            <Input
              id="delete-confirm-email"
              v-model="confirmEmail"
              type="email"
              autocomplete="off"
              spellcheck="false"
              :placeholder="email"
              :aria-invalid="mismatch"
              class="text-sm"
            />
            <FieldError v-if="mismatch" class="text-[11px]">
              Email does not match.
            </FieldError>
          </Field>
        </FieldGroup>

        <p v-if="deleteError" class="text-xs text-destructive">
          {{ deleteError }}
        </p>

        <DialogFooter class="gap-2">
          <Button variant="outline" :disabled="deleting" @click="deleteOpen = false">
            Cancel
          </Button>
          <Button variant="destructive" :disabled="!emailMatches || deleting" @click="deleteAccount">
            {{ deleting ? 'Deleting…' : 'Delete my account' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
