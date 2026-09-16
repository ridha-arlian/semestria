<script setup lang="ts">
  import { ArrowUpRight, Plus, Circle, Copyright } from '@lucide/vue'
  import { Button } from '~/components/ui/button'
  import { Badge } from '~/components/ui/badge'
  import { Separator } from '~/components/ui/separator'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
  import AppLogo from '~/components/icons/AppLogo.vue'
  import GoogleIcon from '~/components/icons/GoogleIcon.vue'
  import ColorModeToggle from '~/components/ColorModeToggle.vue'

  const rows = [
    {
      title: 'Research proposal',
      priority: 'High priority',
      course: 'Design Research',
      dueDate: 'Sep 12, 2026',
      state: 'In progress',
      progress: 65,
      completed: false
    },
    {
      title: 'Midterm reflection essay',
      priority: 'Medium priority',
      course: 'Cultural Studies',
      dueDate: 'Sep 15, 2026',
      state: 'Not started',
      progress: 0,
      completed: false
    },
    {
      title: 'Prototype v2 presentation',
      priority: 'High priority',
      course: 'Interaction Design',
      dueDate: 'Sep 18, 2026',
      state: 'In progress',
      progress: 40,
      completed: false
    },
    {
      title: 'Reading response #04',
      priority: 'Low priority',
      course: 'Design Research',
      dueDate: 'Sep 20, 2026',
      state: 'Not started',
      progress: 0,
      completed: false
    },
    {
      title: 'Group critique notes',
      priority: 'Medium priority',
      course: 'Studio Practice',
      dueDate: 'Sep 22, 2026',
      state: 'Done',
      progress: 100,
      completed: true
    }
  ]
</script>

<template>
  <div class="min-h-screen bg-background text-ink">
    <header class="mx-auto flex h-16 w-[calc(100%-24px)] max-w-295 items-center justify-between border-b border-line md:h-19.5 md:w-[calc(100%-64px)]">
      <NuxtLink to="/" aria-label="Semestria home" class="flex items-center">
        <AppLogo class="h-7 w-auto md:h-9" />
      </NuxtLink>

      <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.04em] md:gap-5">
        <!-- <NuxtLink to="/workspaces" class="inline-flex items-center gap-1.25 border-b border-ink pb-1 text-[11px] font-bold uppercase text-ink hover:border-b-ink/20 hover:text-ink/60 md:gap-1.75 md:text-xs"> -->
        <NuxtLink to="/" class="inline-flex items-center gap-1.25 border-b border-ink pb-1 text-[11px] font-bold uppercase text-ink hover:border-b-ink/20 hover:text-ink/60 md:gap-1.75 md:text-xs">
          <span class="hidden sm:inline">
            Open workspace
          </span>
          <span class="sm:hidden">
            Workspace
          </span>
          <ArrowUpRight class="h-3.5 w-3.5 shrink-0" />
        </NuxtLink>
        <ColorModeToggle />
      </div>
    </header>

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
          <p class="my-4 max-w-none text-sm leading-[1.65] text-strong sm:max-w-55">
            Sign in with Google, add what matters, and keep going. No template building, no setup. Just a workspace that's ready when you are.
          </p>
          <Button variant="outline" size="lg" class="w-full bg-soft text-ink hover:bg-hover sm:w-auto">
            <GoogleIcon class="h-6! w-6! shrink-0" />
            Continue with Google
          </Button>
        </div>

        <div class="hidden self-start border border-line bg-card shadow-[10px_10px_0_var(--line-strong)] sm:block md:rotate-[1.2deg] md:shadow-[22px_22px_0_var(--line-strong)]">
          <div class="flex items-center gap-1.5 border-b border-line px-4 py-3.5 font-mono text-[10px]">
            <Circle class="h-2 w-2 text-subline" />
            <Circle class="h-2 w-2 text-subline" />
            <Circle class="h-2 w-2 text-subline" />

            <strong class="ml-3.5 font-sans text-[13px] font-bold text-headline">
              My semester
            </strong>
            <span class="ml-auto text-subline">
              Fall 2026
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow class="border-t-0 hover:bg-transparent">
                <TableHead class="h-auto px-4 py-3.5 font-mono text-[9px] uppercase tracking-wide text-subline">
                  Task
                </TableHead>
                <TableHead class="h-auto px-4 py-3.5 font-mono text-[9px] uppercase tracking-wide text-subline">
                  Course
                </TableHead>
                <TableHead class="h-auto px-4 py-3.5 font-mono text-[9px] uppercase tracking-wide text-subline">
                  Due Date
                </TableHead>
                <TableHead class="h-auto px-4 py-3.5 font-mono text-[9px] uppercase tracking-wide text-subline">
                  Status
                </TableHead>
                <TableHead class="h-auto px-4 py-3.5 font-mono text-[9px] uppercase tracking-wide text-subline">
                  Progress
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in rows"
                :key="row.title"
                class="border-t border-line hover:bg-transparent"
              >
                <TableCell class="px-4 py-3.5">
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      :checked="row.completed"
                      disabled
                      class="h-4 w-4 cursor-pointer rounded border-line-strong text-ink accent-ink focus:ring-0"
                    >
                    <div>
                      <div
                        class="text-[11px] font-bold"
                        :class="row.completed ? 'text-muted line-through' : 'text-strong'"
                      >
                        {{ row.title }}
                      </div>
                      <div class="text-[9px] text-muted">
                        {{ row.priority }}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell class="px-4 py-3.5 text-[11px] text-subline">
                  {{ row.course }}
                </TableCell>

                <TableCell class="px-4 py-3.5 text-[11px] text-subline">
                  {{ row.dueDate }}
                </TableCell>

                <TableCell class="px-4 py-3.5">
                  <Badge
                    :class="row.state === 'Done'
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line bg-transparent text-subline'"
                    class="rounded-none px-1.75 py-0.75 font-mono text-[9px] font-normal"
                  >
                    {{ row.state }}
                  </Badge>
                </TableCell>

                <TableCell class="px-4 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-soft">
                      <div
                        class="h-full bg-ink"
                        :style="{ width: `${row.progress}%` }"
                      />
                    </div>
                    <span class="font-mono text-[9px] text-muted">
                      {{ row.progress }}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div class="flex items-center gap-2 border-t border-line bg-soft px-5 py-4 font-mono text-[10px] text-muted">
            <Plus class="h-3.5 w-3.5" />
            Add an assignment
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
            <!-- <NuxtLink to="/workspaces" class="flex items-center justify-center gap-1.5">
              Try the demo
              <ArrowUpRight class="h-3.5 w-3.5" />
            </NuxtLink> -->
            <NuxtLink to="/" class="flex items-center justify-center gap-1.5">
              Try the demo
              <ArrowUpRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </Button>
          <span class="font-mono text-[10px] text-subline">
            No setup required
          </span>
        </div>
      </section>
    </main>

    <footer class="mx-auto flex w-[calc(100%-24px)] max-w-295 items-center justify-between border-t border-line-strong py-6 font-mono text-[10px] text-subline md:w-[calc(100%-64px)] md:pb-8.5">
      <span class="inline-flex items-center gap-1">
        <Copyright class="h-3.5 w-3.5" />
        2026 Ridha Arlian
      </span>
    </footer>
  </div>
</template>