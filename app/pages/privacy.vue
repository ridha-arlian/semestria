<script setup lang="ts">
  import privacyBody from '~/content/legal/privacy.md?raw'
  import { LEGAL_UPDATED, LEGAL_VERSION } from '~~/shared/legal'

  definePageMeta({ layout: 'landing' })

  useHead({ title: 'Privacy Policy · Semestria' })
</script>

<template>
  <LegalPage
    title="Privacy Policy"
    :version="LEGAL_VERSION"
    :updated="LEGAL_UPDATED"
    :body="privacyBody"
  />
</template>
