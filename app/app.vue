<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Keep this outside NuxtLayout. On mobile the settings Dialog must paint
       above the sidebar Sheet: both are z-50 by default, and the sidebar portal
       lands later in the DOM. The dialog content is raised to z-60 and its
       overlay to z-55, above the sheet panel. -->
  <SettingsDialog />
</template>