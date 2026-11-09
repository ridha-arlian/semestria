<script setup lang="ts">
  import { Sun, Moon } from '@lucide/vue'

  const colorMode = useColorMode()
  const { run: runThemeTransition } = useThemeTransition()

  function toggleDarkMode(e: MouseEvent) {
    const isDark = colorMode.value === 'dark'
    const next = isDark ? 'light' : 'dark'

    runThemeTransition(() => {
      colorMode.preference = next
    }, { x: e.clientX, y: e.clientY })
  }
</script>

<template>
  <ClientOnly>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 text-ink bg-transparent! hover:opacity-70 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer select-none"
          @click="toggleDarkMode"
        >
          <Sun v-if="colorMode.value === 'dark'" />
          <Moon v-else />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>

    <template #fallback>
      <div class="flex size-8 items-center justify-center text-ink opacity-50">
        <Moon class="size-4 dark:hidden" />
        <Sun class="size-4 hidden dark:block" />
      </div>
    </template>
  </ClientOnly>
</template>