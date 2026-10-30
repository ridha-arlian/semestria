<script setup lang="ts">
import { computed } from 'vue'
import { Bell, Palette, SlidersHorizontal, UserRound, X } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogTitle } from '~/components/ui/dialog'
import { Drawer, DrawerContent, DrawerClose, DrawerDescription, DrawerTitle } from '~/components/ui/drawer'
import type { SettingsSection } from '~/types'

const { isOpen, openSettings, closeSettings, activeSection, toastMessage } = useSettings()
const isDesktop = useMediaQuery('(min-width: 768px)')

const sections: { id: SettingsSection, label: string, description: string, icon: typeof UserRound }[] = [
  { id: 'profile', label: 'Profile', description: 'Name, avatar, and email', icon: UserRound },
  { id: 'appearance', label: 'Appearance', description: 'Mode, theme preset, and accent color', icon: Palette },
  { id: 'notifications', label: 'Notifications', description: 'Reminders and digests', icon: Bell },
  { id: 'preferences', label: 'Preferences', description: 'Week start, landing, workspace', icon: SlidersHorizontal },
]

const Modal = computed(() => ({
  Root: isDesktop.value ? Dialog : Drawer,
  Content: isDesktop.value ? DialogContent : DrawerContent,
  Close: isDesktop.value ? DialogClose : DrawerClose,
  Title: isDesktop.value ? DialogTitle : DrawerTitle,
  Description: isDesktop.value ? DialogDescription : DrawerDescription,
}))

const openState = computed({
  get: () => isOpen.value,
  set: (v) => v ? openSettings() : closeSettings(),
})

function selectSection(id: SettingsSection) {
  activeSection.value = id
}
</script>

<template>
  <component
    :is="Modal.Root"
    v-model:open="openState"
  >
    <component
      :is="Modal.Content"
      :show-close-button="isDesktop ? false : undefined"
      class="flex h-[min(80vh,640px)] sm:max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
      :class="{ 'h-dvh max-h-dvh rounded-none border-0': !isDesktop }"
    >
      <div
        class="flex h-14 shrink-0 items-center justify-between px-5"
      >
        <div class="flex flex-col gap-0.5">
          <component :is="Modal.Title" class="text-base font-semibold text-headline">
            Settings
          </component>
          <component :is="Modal.Description" class="sr-only">
            Manage your profile, appearance, notifications, and preferences.
          </component>
        </div>
        <component :is="Modal.Close" as-child>
          <Button
            data-settings-focus
            variant="ghost"
            size="icon"
            class="size-8 rounded-md text-subline hover:text-ink"
          >
            <X class="size-4" />
            <span class="sr-only">Close</span>
          </Button>
        </component>
      </div>

      <div
        class="flex flex-1 flex-col overflow-hidden"
        :class="{ 'flex-row': isDesktop, 'flex-col': !isDesktop }"
      >
        <nav
          v-if="isDesktop"
          aria-label="Settings sections"
          class="flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-line p-2"
        >
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
            :class="activeSection === section.id
              ? 'bg-soft text-ink'
              : 'text-subline hover:bg-soft hover:text-ink'"
            :aria-current="activeSection === section.id ? 'page' : undefined"
            @click="selectSection(section.id)"
          >
            <component :is="section.icon" class="size-4 shrink-0" />
            <span class="truncate">{{ section.label }}</span>
          </button>
        </nav>

        <div
          class="flex-1 overflow-y-auto"
          :class="{ 'p-6': isDesktop, 'p-4': !isDesktop }"
        >
          <div class="mb-5">
            <h2 class="text-base font-semibold text-headline">
              {{ sections.find(s => s.id === activeSection)?.label }}
            </h2>
            <p class="mt-1 text-sm text-subline">
              {{ sections.find(s => s.id === activeSection)?.description }}
            </p>
          </div>

          <SettingsProfileSection v-if="activeSection === 'profile'" />
          <SettingsAppearanceSection v-else-if="activeSection === 'appearance'" />
          <SettingsNotificationsSection v-else-if="activeSection === 'notifications'" />
          <SettingsPreferencesSection v-else-if="activeSection === 'preferences'" />
        </div>
      </div>

      <div
        v-if="!isDesktop"
        class="flex shrink-0 gap-2 overflow-x-auto border-t border-line p-3"
      >
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
          :class="activeSection === section.id
            ? 'bg-ink text-paper'
            : 'bg-soft text-subline hover:text-ink'"
          :aria-current="activeSection === section.id ? 'page' : undefined"
          @click="selectSection(section.id)"
        >
          <component :is="section.icon" class="size-3.5" />
          <span>{{ section.label }}</span>
        </button>
      </div>

      <Teleport to="body">
        <Transition name="settings-toast">
          <div
            v-if="toastMessage"
            class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-paper shadow-lg"
          >
            {{ toastMessage }}
          </div>
        </Transition>
      </Teleport>
    </component>
  </component>
</template>

<style scoped>
.settings-toast-enter-active,
.settings-toast-leave-active {
  transition: all 0.3s ease;
}
.settings-toast-enter-from,
.settings-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
