<script setup lang="ts">
  definePageMeta({ layout: 'landing' })

  const route = useRoute()

  // Only allow same-origin relative paths; never a protocol-relative URL.
  const loginHref = computed(() => {
    const redirect = route.query.redirect
    const target = typeof redirect === 'string'
      && redirect.startsWith('/')
      && !redirect.startsWith('//')
      ? redirect
      : '/dashboard'
    return `/api/auth/google?redirect=${encodeURIComponent(target)}`
  })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-[calc(100%-24px)] max-w-100 flex-col items-start justify-center py-16 md:w-[calc(100%-64px)]">
    <p class="m-0 font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
      SEMESTRIA
    </p>
    <h1 class="my-4 text-3xl font-extrabold leading-tight tracking-tight text-headline">
      Sign in to continue.
    </h1>
    <p class="m-0 mb-8 text-sm leading-[1.65] text-subline">
      Use your Google account. Your workspaces, tasks and materials are stored per account.
    </p>
    <Button variant="outline" size="lg" class="w-full bg-soft text-ink hover:bg-hover" as-child>
      <a :href="loginHref">
        <IconsGoogleIcon class="h-6! w-6! shrink-0" />
        Continue with Google
      </a>
    </Button>
    <NuxtLink to="/" class="mt-6 text-xs text-subline underline underline-offset-4 hover:text-ink">
      Back to home
    </NuxtLink>
  </main>
</template>
