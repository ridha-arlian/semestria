<script setup lang="ts">
  import { computed } from 'vue'
  import { useElementSize } from '@vueuse/core'
  import { ArrowUpRight } from '@lucide/vue'

  definePageMeta({
    layout: 'landing'
  })

  // The preview is laid out at the dashboard's desktop width, then scaled to
  // fill the available column so its proportions stay identical everywhere.
  const DESIGN_WIDTH = 1024
  const PREVIEW_BUFFER = 64

  const previewViewport = useTemplateRef<HTMLElement>('previewViewport')
  const previewFrame = useTemplateRef<HTMLElement>('previewFrame')

  const { width: viewportWidth } = useElementSize(previewViewport)
  const { height: frameHeight } = useElementSize(previewFrame)

  const previewScale = computed(() => viewportWidth.value > 0 ? viewportWidth.value / DESIGN_WIDTH : 1)
  const previewHeight = computed(() => frameHeight.value > 0
    ? Math.ceil((frameHeight.value + PREVIEW_BUFFER) * previewScale.value)
    : 0)
</script>

<template>
  <main class="mx-auto w-[calc(100%-24px)] max-w-295 md:w-[calc(100%-64px)]">
    <section aria-labelledby="hero-title" class="relative block border-b border-line-strong py-10 md:grid md:min-h-127.5 md:grid-cols-[1fr_3fr_1fr] md:items-center md:py-0">
      <div class="hidden md:block" />
      <div class="py-6 md:py-13.75">
        <p class="m-0 font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
          FOR EVERYTHING YOU'RE JUGGLING
        </p>

        <h1 id="hero-title" class="my-4 text-[clamp(38px,12vw,132px)] font-extrabold leading-[1.08] tracking-tight text-headline sm:my-5 md:my-6.5 md:leading-[1.05]">
          Finally,<br><em class="text-subline">everything in one place.</em>
        </h1>

        <p class="m-0 max-w-100 text-sm leading-[1.65] text-subline sm:text-base">
          A small home for assignments, course materials, and the small details that keep slipping through the cracks.
        </p>
      </div>
      <div class="hidden md:block" />
    </section>

    <section aria-label="Semestria workspace preview" class="block border-b border-line py-12 md:grid md:grid-cols-[1fr_2.15fr] md:gap-17.5 md:py-[100px_0_130px]">
      <div class="mb-8 md:mb-0">
        <span class="font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
          The workspace
        </span>
        <p class="my-4 max-w-none text-sm leading-[1.65] text-text-strong sm:max-w-55">
          Sign in with Google, add what matters, and keep going. No template building, no setup. Just a workspace that's ready when you are.
        </p>
        <Button variant="outline" size="lg" class="w-full bg-soft text-ink hover:bg-hover sm:w-auto" as-child>
          <a href="/api/auth/google">
            <IconsGoogleIcon class="h-6! w-6! shrink-0" />
            Continue with Google
          </a>
        </Button>
      </div>

      <div
        ref="previewViewport"
        class="relative hidden w-full self-start sm:block"
        :style="previewHeight ? { height: `${previewHeight}px` } : undefined"
      >
        <div
          class="origin-top-left"
          :class="previewHeight ? 'absolute left-0 top-0' : ''"
          :style="{ width: `${DESIGN_WIDTH}px`, transform: `scale(${previewScale})` }"
        >
          <div ref="previewFrame">
            <LandingWorkspacePreview />
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-line py-12 md:py-[110px_0_130px]">
      <p class="font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
        Why it exists
      </p>
      <p class="my-5 max-w-225 text-[clamp(26px,7vw,63px)] leading-[1.1] tracking-[-0.03em] text-subline md:my-7 md:leading-[1.03] md:tracking-[-0.07em]">
        Some tools box you in. Others hand you a blank page.
        <strong class="font-medium text-headline">
          Semestria starts with the room already ready.
        </strong>
      </p>

      <div class="flex h-4 flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase text-subline sm:gap-3 md:gap-4">
        <span>
          Assignments
        </span>
        <Separator orientation="vertical" class="bg-line" />
        <span>
          Materials
        </span>
        <Separator orientation="vertical" class="bg-line" />
        <span>
          Notes
        </span>
      </div>
    </section>

    <section class="block py-12 md:flex md:items-end md:justify-between md:gap-8 md:py-[82px_0_100px]">
      <div class="max-w-3xl">
        <p class="font-mono text-[10px] uppercase tracking-[0.08em] text-subline">
          Make space for the work
        </p>
        <h2 class="mt-4 text-[clamp(28px,7vw,68px)] leading-[1.02] tracking-[-0.04em] text-headline md:mt-4.5 md:leading-[0.95] md:tracking-[-0.075em]">
          A calmer way to move through it all.
        </h2>
      </div>

      <div class="mt-6 flex flex-col items-start gap-2.5 shrink-0 sm:flex-row sm:items-center md:mt-0 md:flex-col md:items-end">
        <Button as-child size="lg" class="w-full sm:w-auto">
          <NuxtLink to="/dashboard" class="flex items-center justify-center gap-1.5">
            Try the demo
            <ArrowUpRight class="size-3.5" />
          </NuxtLink>
        </Button>
        <span class="font-mono text-[10px] text-subline">
          No setup required
        </span>
      </div>
    </section>
  </main>
</template>