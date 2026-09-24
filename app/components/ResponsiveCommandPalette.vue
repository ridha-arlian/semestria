<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core'
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

  const props = withDefaults(defineProps<{ open: boolean, title?: string, description?: string }>(), {
    title: 'Command Palette',
    description: 'Search assignments, materials, or run a command',
  })

  const emit = defineEmits<{'update:open': [value: boolean]}>()

  const isDesktop = useMediaQuery('(min-width: 640px)')

  const Modal = computed(() => ({
    Root: isDesktop.value ? Dialog : Drawer,
    Content: isDesktop.value ? DialogContent : DrawerContent,
    Header: isDesktop.value ? DialogHeader : DrawerHeader,
    Title: isDesktop.value ? DialogTitle : DrawerTitle,
    Description: isDesktop.value ? DialogDescription : DrawerDescription,
  }))

  const openState = computed({
    get: () => props.open,
    set: val => emit('update:open', val),
  })

  function handleViewportChange() {
    if (isDesktop.value) return
    const active = document.activeElement
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', handleViewportChange)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', handleViewportChange)
  })
</script>

<template>
  <component
    :is="Modal.Root"
    v-model:open="openState"
  >
    <component
      :is="Modal.Content"
      class="[&>button]:hidden"
      :class="[
        isDesktop
          ? 'max-w-lg overflow-hidden rounded-xl border-none p-0 shadow-lg'
          : 'max-h-[85dvh] px-4 pb-6 pt-2 sm:px-0',
      ]"
    >
      <component :is="Modal.Header" class="sr-only">
        <component :is="Modal.Title">
          {{ title }}
        </component>
        <component :is="Modal.Description">
          {{ description }}
        </component>
      </component>

      <slot />
    </component>
  </component>
</template>