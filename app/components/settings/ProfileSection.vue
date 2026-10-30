<script setup lang="ts">
import { Camera, RotateCcw, UserRound } from '@lucide/vue'

const { settings, avatarUrl, setAvatarBlob, showToast } = useSettings()

const nameInput = ref('')
const emailInput = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const nameError = ref(false)

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

function handleCropSave(blob: Blob) {
  setAvatarBlob(blob)
  showToast('Avatar updated')
}

function handleRemoveAvatar() {
  setAvatarBlob(null)
  showToast('Avatar removed')
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function handleNameBlur() {
  const value = nameInput.value.trim()
  if (!value) {
    nameError.value = true
    return
  }
  nameError.value = false
  settings.value.profile.name = value
}

function handleEmailBlur() {
  const value = emailInput.value.trim()
  if (!validateEmail(value)) {
    showToast('Invalid email address')
    emailInput.value = settings.value.profile.email
    return
  }
  settings.value.profile.email = value
}

function init() {
  nameInput.value = settings.value.profile.name
  emailInput.value = settings.value.profile.email
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
            @click="handleRemoveAvatar"
          >
            <RotateCcw />
            Remove
          </Button>
        </div>
        <p class="text-[11px] text-subline">
          PNG, JPG, or WebP up to 10MB. Avatar is temporary and cleared on reload.
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

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="settings-display-name" class="text-sm">Display name</Label>
        <Input
          id="settings-display-name"
          v-model="nameInput"
          type="text"
          placeholder="Ari Rahman"
          class="text-sm"
          :aria-invalid="nameError || undefined"
          :aria-describedby="nameError ? 'settings-display-name-error' : undefined"
          @blur="handleNameBlur"
        />
        <p v-if="nameError" id="settings-display-name-error" class="text-[11px] text-destructive">
          Name cannot be empty.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="settings-email" class="text-sm">Email</Label>
        <Input
          id="settings-email"
          v-model="emailInput"
          type="email"
          placeholder="ari.rahman@example.com"
          class="text-sm"
          @blur="handleEmailBlur"
        />
        <p class="text-[11px] text-subline">
          Email is stored locally in this browser only.
        </p>
      </div>
    </div>

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
