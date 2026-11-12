<script setup lang="ts">
  import { ArrowUpRight } from '@lucide/vue'
  import { DEMO_SIGN_IN_HREF } from '~~/shared/demo'

  const { isDemo } = useDemo()
</script>

<template>
  <div
    v-if="isDemo"
    class="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-soft px-5 py-2 md:px-9"
  >
    <p class="m-0 font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
      Demo mode — changes are temporary
    </p>
    <a
      :href="DEMO_SIGN_IN_HREF"
      class="inline-flex items-center gap-1 border-b border-ink pb-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-ink transition-colors hover:border-ink/20 hover:text-ink/60"
    >
      Sign in with Google
      <ArrowUpRight class="size-3" />
    </a>
  </div>
</template>
