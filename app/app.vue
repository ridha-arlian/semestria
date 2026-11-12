<script setup lang="ts">
  const colorMode = useColorMode()
  const theme = computed<'light' | 'dark'>(() => (colorMode.value === 'dark' ? 'dark' : 'light'))
</script>

<template>
  <TooltipProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Keep this outside NuxtLayout so the settings dialog can be opened from
         every layout. The mobile sidebar closes before it opens, so it needs no
         custom stacking. -->
    <SettingsDialog />
    <!-- Terms/Privacy acceptance. Also outside NuxtLayout: it must cover every
         authenticated layout and the landing page after a client-side login. -->
    <LegalConsentDialog />
    <!-- Toasts live outside NuxtLayout too: mutations fire from every layout. -->
    <Toaster position="bottom-right" :theme="theme" />
  </TooltipProvider>
</template>