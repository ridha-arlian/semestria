<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
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

  const insetRef = ref<HTMLElement>()

  function handleViewportChange() {
    if (isDesktop.value || !window.visualViewport || !insetRef.value) return
    const vv = window.visualViewport
    const offset = window.innerHeight - vv.height - vv.offsetTop
    insetRef.value.style.transform = offset > 0 ? `translateY(-${offset}px)` : ''
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', handleViewportChange)
    window.visualViewport?.removeEventListener('scroll', handleViewportChange)
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

      <div ref="insetRef" class="transition-transform duration-150 ease-out">
        <slot />
      </div>
    </component>
  </component>
</template>