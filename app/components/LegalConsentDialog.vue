<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'
  import { LEGAL_CONTACT_EMAIL } from '~~/shared/legal'

  const authUser = useAuthUser()
  const { isDemo } = useDemo()
  const route = useRoute()

  const open = ref(false)
  const loading = ref(false)
  const submitting = ref(false)
  const agree = ref(false)
  const ageConfirmed = ref(false)
  const version = ref('')
  const error = ref<string | null>(null)

  const canSubmit = computed(() => agree.value && ageConfirmed.value && !submitting.value)

  async function loadState() {
    if (!import.meta.client)
      return
    if (!authUser.value || isDemo.value) {
      open.value = false
      return
    }
    // Never cover the documents the user is being asked to accept.
    if (isPublicRoute(route.path)) {
      open.value = false
      return
    }
    // Do not refetch while the dialog is already showing; a revalidation would
    // reset the checkboxes.
    if (open.value || loading.value)
      return

    loading.value = true
    try {
      const state = await $fetch<{ version: string, needsConsent: boolean }>('/api/me/consent')
      version.value = state.version
      open.value = state.needsConsent
    }
    catch {
      // A failed check must not block the app; the next navigation retries.
    }
    finally {
      loading.value = false
    }
  }

  async function accept() {
    if (!canSubmit.value)
      return
    submitting.value = true
    error.value = null
    try {
      await $fetch('/api/me/consent', {
        method: 'PATCH',
        body: { version: version.value },
      })
      open.value = false
    }
    catch {
      error.value = `Could not save your acceptance. Try again, or email ${LEGAL_CONTACT_EMAIL}.`
    }
    finally {
      submitting.value = false
    }
  }

  async function signOut() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    catch {
      // The redirect below still drops the client state.
    }
    window.location.href = '/'
  }

  onMounted(() => {
    void loadState()
  })

  watch([authUser, isDemo, () => route.path], () => {
    void loadState()
  })
</script>

<template>
  <Dialog :open="open">
    <DialogContent
      :show-close-button="false"
      class="max-w-md gap-5"
      @pointer-down-outside.prevent
      @escape-key-down.prevent
      @interact-outside.prevent
    >
      <div class="flex flex-col gap-2">
        <DialogTitle class="text-lg font-semibold text-headline">
          Before you continue
        </DialogTitle>
        <DialogDescription class="text-sm leading-relaxed text-subline">
          Semestria is for users 17 and older. Please confirm that you accept our
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-ink underline underline-offset-2"
          >Terms &amp; Conditions</a>
          and
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-ink underline underline-offset-2"
          >Privacy Policy</a>.
        </DialogDescription>
      </div>

      <div class="flex flex-col gap-3">
        <label class="flex cursor-pointer items-start gap-2.5 text-sm text-text-strong">
          <Checkbox v-model="ageConfirmed" class="mt-0.5" />
          <span>I am 17 years or older.</span>
        </label>

        <label class="flex cursor-pointer items-start gap-2.5 text-sm text-text-strong">
          <Checkbox v-model="agree" class="mt-0.5" />
          <span>I have read and agree to the Terms &amp; Conditions and Privacy Policy.</span>
        </label>
      </div>

      <p v-if="error" class="text-xs text-destructive">
        {{ error }}
      </p>

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-4">
          <a
            :href="`mailto:${LEGAL_CONTACT_EMAIL}`"
            class="font-mono text-[10px] uppercase tracking-[0.08em] text-subline underline-offset-4 hover:text-ink hover:underline"
          >
            Contact
          </a>
          <button
            type="button"
            class="cursor-pointer font-mono text-[10px] uppercase tracking-[0.08em] text-subline underline-offset-4 hover:text-ink hover:underline"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
        <Button :disabled="!canSubmit" @click="accept">
          {{ submitting ? 'Saving…' : 'Agree and continue' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
