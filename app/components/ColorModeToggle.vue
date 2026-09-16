<script setup lang="ts">
  import { Sun, Moon } from '@lucide/vue'
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
      size="icon"
      @click="toggleDarkMode"
      class="h-8 w-8 text-ink bg-transparent! hover:opacity-70 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer select-none"
      title="Toggle theme"
    >
      <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
      <Moon v-else class="h-4 w-4" />
      <span class="sr-only">Toggle theme</span>
    </Button>

    <template #fallback>
      <div class="h-8 w-8 flex items-center justify-center text-ink opacity-50">
        <Moon class="h-4 w-4 dark:hidden" />
        <Sun class="h-4 w-4 hidden dark:block" />
      </div>
    </template>
  </ClientOnly>
</template>