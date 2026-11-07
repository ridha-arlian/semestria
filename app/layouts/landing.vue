<script setup lang="ts">
  import { computed } from 'vue'
  import { ArrowUpRight, Copyright } from '@lucide/vue'

  const authUser = useState<{ id: string } | null>('auth-user', () => null)
  const authLoaded = useState<boolean>('auth-user-loaded', () => false)

  // The landing page is public, so auth.global skips it and never fills the
  // session cache. Fetch it once so the header can tell guests from members.
  if (!authLoaded.value) {
    const request = useRequestFetch()
    authUser.value = await request<{ id: string } | null>('/api/auth/me').catch(() => null)
    authLoaded.value = true
  }

  const isAuthenticated = computed(() => Boolean(authUser.value))

  function scrollToSignIn() {
    document.getElementById('sign-in')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
</script>

<template>
  <div class="min-h-screen bg-background text-ink">
    <header class="mx-auto flex h-16 w-[calc(100%-24px)] max-w-295 items-center justify-between border-b border-line md:h-19.5 md:w-[calc(100%-64px)]">
      <NuxtLink to="/" aria-label="Semestria home" class="flex items-center">
        <IconsAppLogo class="h-7 w-auto md:h-9" />
      </NuxtLink>

      <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.04em] md:gap-5">
        <NuxtLink v-if="isAuthenticated" to="/dashboard" class="inline-flex items-center gap-1.25 border-b border-ink pb-1 text-[11px] font-bold uppercase text-ink hover:border-b-ink/20 hover:text-ink/60 md:gap-1.75 md:text-xs">
          <span class="hidden sm:inline">
            Open workspace
          </span>
          <span class="sm:hidden">
            Workspace
          </span>
          <ArrowUpRight class="h-3.5 w-3.5 shrink-0" />
        </NuxtLink>
        <button v-else type="button" class="inline-flex cursor-pointer items-center border-b border-ink pb-1 text-[11px] font-bold uppercase text-ink hover:border-b-ink/20 hover:text-ink/60 md:text-xs" @click="scrollToSignIn">
          Login
        </button>
        <ColorModeToggle />
      </div>
    </header>
    
    <slot />
    
    <footer class="mx-auto flex w-[calc(100%-24px)] max-w-295 items-center justify-between border-t border-line-strong py-6 font-mono text-[10px] text-subline md:w-[calc(100%-64px)] md:pb-8.5">
      <span class="inline-flex items-center gap-1">
        <Copyright class="h-3.5 w-3.5" />
        2026 Ridha Arlian
      </span>
    </footer>
  </div>
</template>