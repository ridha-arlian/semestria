<script setup lang="ts">
import { Camera, RotateCcw, UserRound } from '@lucide/vue'

const api = useApi()
const { settings, avatarUrl, setAvatarBlob, showToast } = useSettings()

const nameInput = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const nameSaving = ref(false)
const nameError = computed(() => nameInput.value.trim().length === 0)
const nameDirty = computed(() => nameInput.value.trim() !== settings.value.profile.name)
const nameValid = computed(() => !nameError.value && nameInput.value.trim().length <= 120)
const avatarBusy = ref(false)

const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function deleteAccount() {
  if (deleting.value)
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

const cropOpen = ref(false)
const cropSrc = ref<string | null>(null)

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_BYTES = 10 * 1024 * 1024

function clearCropSrc() {
  if (cropSrc.value)
    URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = null
}

function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // Reset the input so picking the same file again still fires a change event.
  target.value = ''
  if (!file)
    return
  if (!ACCEPTED_TYPES.includes(file.type)) {
    showToast('Choose a PNG, JPG, or WebP image')
    return
  }
  if (file.size > MAX_FILE_BYTES) {
    showToast('Avatar must be 10MB or smaller')
    return
  }
  clearCropSrc()
  cropSrc.value = URL.createObjectURL(file)
  cropOpen.value = true
}

function handleCropOpen(open: boolean) {
  cropOpen.value = open
  if (!open)
    clearCropSrc()
}

interface AvatarTicket {
  url: string
  method: 'PUT'
  contentType: string
  key: string
}

async function uploadAvatar(blob: Blob) {
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const contentType = blob.type || 'image/jpeg'
  avatarBusy.value = true
  try {
    const ticket = await api.request<AvatarTicket>('/api/me/avatar-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: `avatar.${ext}`,
        fileSize: blob.size,
        contentType,
      }),
    })
    const response = await fetch(ticket.url, {
      method: ticket.method,
      headers: { 'Content-Type': ticket.contentType },
      body: blob,
    })
    if (!response.ok)
      throw new Error(`Upload failed (${response.status}).`)
    await api.request('/api/me/avatar', { method: 'PATCH', body: JSON.stringify({ key: ticket.key }) })
    setAvatarBlob(blob)
    showToast('Avatar updated')
  }
  catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not update avatar')
  }
  finally {
    avatarBusy.value = false
  }
}

function handleCropSave(blob: Blob) {
  void uploadAvatar(blob)
}

async function handleRemoveAvatar() {
  if (avatarBusy.value)
    return
  avatarBusy.value = true
  try {
    await api.request('/api/me/avatar', { method: 'DELETE' })
    setAvatarBlob(null)
    showToast('Avatar removed')
  }
  catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not remove avatar')
  }
  finally {
    avatarBusy.value = false
  }
}

async function saveName() {
  const value = nameInput.value.trim()
  if (!nameValid.value || !nameDirty.value || nameSaving.value)
    return
  nameSaving.value = true
  try {
    const updated = await api.saveSettings({ profile: { ...settings.value.profile, name: value } })
    if (updated) {
      settings.value = updated
      nameInput.value = updated.profile.name
      showToast('Name updated')
    }
  }
  catch {
    showToast('Could not save name')
  }
  finally {
    nameSaving.value = false
  }
}

function resetName() {
  nameInput.value = settings.value.profile.name
}

function init() {
  nameInput.value = settings.value.profile.name
}

onMounted(init)
onBeforeUnmount(clearCropSrc)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <div class="relative size-16 shrink-0 overflow-hidden rounded-full border border-line bg-soft">
        <Avatar class="size-full">
          <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="settings.profile.name" />
          <AvatarFallback class="bg-ink text-paper">
            <UserRound />
          </AvatarFallback>
        </Avatar>
      </div>
      <div class="flex flex-1 flex-col gap-2">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs"
            :disabled="avatarBusy"
            @click="fileInput?.click()"
          >
            <Camera />
            Change avatar
          </Button>
          <Button
            v-if="avatarUrl"
            variant="ghost"
            size="sm"
            class="gap-1.5 text-xs"
            :disabled="avatarBusy"
            @click="handleRemoveAvatar"
          >
            <RotateCcw />
            Remove
          </Button>
        </div>
        <p class="text-[11px] text-subline">
          PNG, JPG, or WebP up to 10MB. The saved avatar is resized to 512 px.
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="handleAvatarChange"
      >
    </div>

    <FieldGroup class="gap-4">
      <form class="flex flex-col gap-3" novalidate @submit.prevent="saveName">
        <Field class="gap-1.5" :data-invalid="nameError">
          <FieldLabel for="settings-display-name" class="text-sm">Display name</FieldLabel>
          <Input
            id="settings-display-name"
            v-model="nameInput"
            type="text"
            placeholder="Ari Rahman"
            class="text-sm"
            maxlength="120"
            :disabled="nameSaving"
            :aria-invalid="nameError || undefined"
            :aria-describedby="nameError ? 'settings-display-name-error' : undefined"
          />
          <FieldError v-if="nameError" id="settings-display-name-error" class="text-[11px]">
            Name cannot be empty.
          </FieldError>
        </Field>
        <div class="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            class="text-xs"
            :disabled="!nameDirty || !nameValid || nameSaving"
          >
            Save
          </Button>
          <Button
            v-if="nameDirty"
            type="button"
            variant="ghost"
            size="sm"
            class="text-xs"
            :disabled="nameSaving"
            @click="resetName"
          >
            Cancel
          </Button>
        </div>
      </form>

      <Field class="gap-1.5">
        <FieldLabel for="settings-email" class="text-sm">Email</FieldLabel>
        <Input
          id="settings-email"
          :model-value="settings.profile.email"
          type="email"
          disabled
          class="text-sm"
        />
        <FieldDescription class="text-[11px]">
          Email is your sign-in identity and cannot be changed here.
        </FieldDescription>
      </Field>
    </FieldGroup>

    <div class="rounded-lg border border-line p-4">
      <h3 class="text-sm font-semibold text-headline">
        Danger zone
      </h3>
      <p class="mt-1 text-xs leading-relaxed text-subline">
        Deleting your account removes your workspaces, tasks, materials, notes, uploaded files, avatar, and activity history. This cannot be undone.
      </p>
      <Button
        variant="destructive"
        size="sm"
        class="mt-3 text-xs"
        @click="deleteOpen = true"
      >
        Delete account
      </Button>
    </div>

    <Dialog v-model:open="deleteOpen">
      <DialogContent :show-close-button="false" class="max-w-md">
        <div class="flex flex-col gap-2">
          <DialogTitle class="text-lg font-semibold text-headline">
            Delete your account?
          </DialogTitle>
          <DialogDescription class="text-sm leading-relaxed text-subline">
            This permanently deletes your account and everything in it. Residual copies in provider backups expire within 30 days. You will be signed out immediately.
          </DialogDescription>
        </div>

        <p v-if="deleteError" class="text-xs text-destructive">
          {{ deleteError }}
        </p>

        <DialogFooter class="gap-2">
          <Button variant="outline" :disabled="deleting" @click="deleteOpen = false">
            Cancel
          </Button>
          <Button variant="destructive" :disabled="deleting" @click="deleteAccount">
            {{ deleting ? 'Deleting…' : 'Delete my account' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ClientOnly>
      <SettingsAvatarCropDialog
        :open="cropOpen"
        :src="cropSrc"
        @update:open="handleCropOpen"
        @save="handleCropSave"
      />
    </ClientOnly>
  </div>
</template>
