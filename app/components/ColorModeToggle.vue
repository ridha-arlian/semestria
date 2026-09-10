<script setup lang="ts">
  import { Button } from '@/components/ui/button'

  const colorMode = useColorMode()

  function toggleDarkMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleThemeChange = (e: MediaQueryListEvent) => {
      colorMode.preference = e.matches ? 'dark' : 'light'
    }

    mediaQuery.addEventListener('change', handleThemeChange)

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    })
  })
</script>

<template>
  <ClientOnly>
    <Button
      variant="ghost"
      size="sm"
      @click="toggleDarkMode"
      class="h-auto p-0 font-mono text-xs sm:text-sm tracking-wider text-ink uppercase transition-opacity hover:opacity-50 bg-transparent! !hover:bg-transparent !hover:text-ink focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer select-none"
    >
      {{ colorMode.value === 'dark' ? 'LIGHT MODE?' : 'DARK MODE?' }}
    </Button>

    <template #fallback>
      <span class="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase cursor-pointer dark:hidden">
        DARK MODE?
      </span>
      <span class="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase cursor-pointer hidden dark:inline">
        LIGHT MODE?
      </span>
    </template>
  </ClientOnly>
</template>