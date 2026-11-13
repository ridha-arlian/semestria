<script setup lang="ts">
import { Camera, RotateCcw, UserRound } from '@lucide/vue'
import { toast } from 'vue-sonner'

const api = useApi()
const {
  settings, avatarUrl, setAvatarBlob,
  nameDraft, nameSaving, nameDirty, nameError, nameValid,
  initNameDraft, discardName, saveName,
} = useSettings()

const fileInput = ref<HTMLInputElement | null>(null)

const avatarBusy = ref(false)

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
    toast.error('Choose a PNG, JPG, or WebP image')
    return
  }
  if (file.size > MAX_FILE_BYTES) {
    toast.error('Avatar must be 10MB or smaller')
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
    toast.success('Avatar updated')
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : 'Could not update avatar')
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
    toast.success('Avatar removed')
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : 'Could not remove avatar')
  }
  finally {
    avatarBusy.value = false
  }
}

onMounted(initNameDraft)
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
          <div class="flex items-center gap-2">
            <Input
              id="settings-display-name"
              v-model="nameDraft"
              type="text"
              placeholder="Ari Rahman"
              class="min-w-0 flex-1 text-sm"
              maxlength="120"
              :disabled="nameSaving"
              :aria-invalid="nameError || undefined"
              :aria-describedby="nameError ? 'settings-display-name-error' : undefined"
            />
            <Button
              type="submit"
              size="sm"
              class="shrink-0 text-xs"
              :disabled="!nameDirty || !nameValid || nameSaving"
            >
              Save
            </Button>
            <Button
              v-if="nameDirty"
              type="button"
              variant="ghost"
              size="sm"
              class="shrink-0 text-xs"
              :disabled="nameSaving"
              @click="discardName"
            >
              Cancel
            </Button>
          </div>
          <FieldError v-if="nameError" id="settings-display-name-error" class="text-[11px]">
            Name cannot be empty.
          </FieldError>
        </Field>
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
