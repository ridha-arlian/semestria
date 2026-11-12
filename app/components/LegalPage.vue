<script setup lang="ts">
  import { computed } from 'vue'
  import { marked } from 'marked'

  const props = defineProps<{
    title: string
    version: string
    updated: string
    body: string
  }>()

  // Content is authored in the repo, never user input, so no sanitizer is
  // needed. `async: false` keeps the render synchronous for SSR.
  const html = computed(() => marked.parse(props.body, { async: false }) as string)
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-295 md:w-[calc(100%-64px)]">
    <article class="max-w-3xl py-10 md:py-16">
      <NuxtLink
        to="/"
        class="font-mono text-[10px] uppercase tracking-[0.08em] text-subline underline-offset-4 hover:text-ink hover:underline"
      >
        Back to Semestria
      </NuxtLink>

      <h1 class="mt-6 text-[clamp(32px,7vw,56px)] font-extrabold leading-[1.05] tracking-tight text-headline">
        {{ title }}
      </h1>
      <p class="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
        Version {{ version }} · Last updated {{ updated }}
      </p>

      <!-- Content is authored in this repo, never user input. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="legal-prose mt-10" v-html="html" />
    </article>
  </main>
</template>

<style scoped>
.legal-prose {
  color: var(--subline);
  font-size: 0.9375rem;
  line-height: 1.7;
}

.legal-prose :deep(h2) {
  margin: 2.5rem 0 0.75rem;
  color: var(--headline);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.35;
}

.legal-prose :deep(h2:first-child) {
  margin-top: 0;
}

.legal-prose :deep(h3) {
  margin: 1.75rem 0 0.5rem;
  color: var(--headline);
  font-size: 1rem;
  font-weight: 600;
}

.legal-prose :deep(p) {
  margin: 0 0 1rem;
}

.legal-prose :deep(ul),
.legal-prose :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.legal-prose :deep(ul) {
  list-style: disc;
}

.legal-prose :deep(ol) {
  list-style: decimal;
}

.legal-prose :deep(li) {
  margin: 0.35rem 0;
}

.legal-prose :deep(strong) {
  color: var(--headline);
  font-weight: 600;
}

.legal-prose :deep(a) {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.legal-prose :deep(hr) {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid var(--line);
}

.legal-prose :deep(blockquote) {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 2px solid var(--line-strong);
  color: var(--subline);
}

.legal-prose :deep(table) {
  width: 100%;
  margin: 0 0 1.25rem;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.legal-prose :deep(th),
.legal-prose :deep(td) {
  padding: 0.5rem 0.75rem 0.5rem 0;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.legal-prose :deep(th) {
  color: var(--headline);
  font-weight: 600;
}

.legal-prose :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85em;
}
</style>
