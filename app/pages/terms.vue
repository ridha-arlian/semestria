<script setup lang="ts">
  import termsBody from '~/content/legal/terms.md?raw'
  import { LEGAL_UPDATED, LEGAL_VERSION } from '~~/shared/legal'

  definePageMeta({ layout: 'landing' })

  useHead({ title: 'Terms & Conditions · Semestria' })
</script>

<template>
  <LegalPage
    title="Terms & Conditions"
    :version="LEGAL_VERSION"
    :updated="LEGAL_UPDATED"
    :body="termsBody"
  />
</template>
