<script setup lang="ts">
import { useSettings } from '~/composables/useSettings'

const { openSettings } = useSettings()

// Redirect to the main page and open settings modal
openSettings()
</script>

<template>
  <div />
</template>