<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Keep this outside NuxtLayout so the settings dialog can be opened from
       every layout. The mobile sidebar closes before it opens, so it needs no
       custom stacking. -->
  <SettingsDialog />
</template>