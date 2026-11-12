<script setup lang="ts">
  import { computed } from 'vue'
  import { ArrowUpRight, Copyright } from '@lucide/vue'
  import type { AuthUser } from '~/composables/useAuthUser'

  const authUser = useAuthUser()
  const authLoaded = useState<boolean>('auth-user-loaded', () => false)

  // The landing page is public, so auth.global skips it and never fills the
  // session cache. Fetch it once so the header can tell guests from members.
  if (!authLoaded.value) {
    const request = useRequestFetch()
    authUser.value = await request<AuthUser | null>('/api/auth/me').catch(() => null)
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
          <ArrowUpRight class="size-3.5 shrink-0" />
        </NuxtLink>
        <Button
          v-else
          type="button"
          variant="link"
          class="h-auto cursor-pointer items-center gap-0 rounded-none border-b border-ink p-0 pb-1 text-[11px] font-bold uppercase text-ink no-underline hover:border-b-ink/20 hover:text-ink/60 hover:no-underline md:text-xs"
          @click="scrollToSignIn"
        >
          Login
        </Button>
        <ColorModeToggle />
      </div>
    </header>
    
    <slot />
    
    <footer class="mx-auto flex w-[calc(100%-24px)] max-w-295 flex-wrap items-center justify-between gap-3 border-t border-line-strong py-6 font-mono text-[10px] text-subline md:w-[calc(100%-64px)] md:pb-8.5">
      <span class="inline-flex items-center gap-1">
        <Copyright class="size-3.5" />
        2026 Ridha Arlian
      </span>
      <nav aria-label="Legal" class="flex items-center gap-4">
        <NuxtLink to="/privacy" class="underline-offset-4 hover:text-ink hover:underline">
          Privacy
        </NuxtLink>
        <NuxtLink to="/terms" class="underline-offset-4 hover:text-ink hover:underline">
          Terms
        </NuxtLink>
      </nav>
    </footer>
  </div>
</template>