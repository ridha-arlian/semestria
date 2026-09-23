<script setup lang="ts">
  import { Plus, SearchIcon } from '@lucide/vue'
  import { useDateFormat, useMagicKeys, useMounted, whenever } from '@vueuse/core'
  import { computed, ref } from 'vue'
  import ResponsiveCommandPalette from '@/components/ResponsiveCommandPalette.vue'
  import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
  import { Button } from '@/components/ui/button'
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
  import { Kbd, KbdGroup } from '@/components/ui/kbd'
  import { useSidebar } from '@/components/ui/sidebar'
  import AppIcon from '~/components/icons/AppIcon.vue'
  import type { BreadcrumbEntry, View } from '~/types/dashboard'

  const { view, breadcrumbs } = defineProps<{
    view: View
    breadcrumbs?: BreadcrumbEntry[]
  }>()

  const emit = defineEmits<{
    'add-assignment': []
    'add-material': []
    'navigate': [view: View]
  }>()

  const { toggleSidebar } = useSidebar()
  const open = ref(false)

  const { meta_q, ctrl_q } = useMagicKeys()
  whenever(() => meta_q?.value || ctrl_q?.value, () => {
    open.value = !open.value
  })

  const isMounted = useMounted()
  const formattedDate = useDateFormat(computed(() => (isMounted.value ? new Date() : undefined)), 'dddd, MMMM D, YYYY', { locales: 'en-US' })
  
  const headingDesktop = computed(() => 'Good morning, Ari.')
  const headingMobile = computed(() => view)
  const isOverview = computed(() => !breadcrumbs || breadcrumbs.length === 0)

  function handleSelectAction(action: () => void) {
    open.value = false
    action()
  }
</script>

<template>
  <header class="sticky top-0 z-10 flex h-19 items-center justify-between border-b border-line bg-paper/95 px-5 backdrop-blur md:px-9">
    <div class="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        class="size-8 md:hidden"
        aria-label="Toggle sidebar"
        @click="toggleSidebar"
      >
        <AppIcon class="size-8" />
      </Button>

      <div>
        <p v-if="isOverview" class="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-subline md:block">
          {{ formattedDate || '...' }}
        </p>

        <Breadcrumb v-else class="hidden md:block">
          <BreadcrumbList>
            <template v-for="(crumb, i) in breadcrumbs" :key="crumb.label">
              <BreadcrumbItem>
                <BreadcrumbLink v-if="i < breadcrumbs!.length - 1" as-child class="text-subline transition-colors hover:text-ink">
                  <NuxtLink v-if="crumb.to" :to="crumb.to">
                    {{ crumb.label }}
                  </NuxtLink>
                  <NuxtLink v-else-if="crumb.view" class="cursor-pointer" @click="emit('navigate', crumb.view)">
                    {{ crumb.label }}
                  </NuxtLink>
                </BreadcrumbLink>
                <BreadcrumbPage v-else class="text-headline font-medium">
                  {{ crumb.label }}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="i < breadcrumbs!.length - 1" class="text-subline" />
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 class="text-base font-semibold tracking-[-0.03em] text-headline md:hidden">
          {{ headingMobile }}
        </h1>

        <h1 class="hidden text-xl font-semibold tracking-[-0.03em] text-headline md:mt-1 md:block">
          {{ headingDesktop }}
        </h1>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        class="size-9 sm:hidden"
        aria-label="Search"
        @click="open = true"
      >
        <SearchIcon class="size-4 text-subline" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="hidden h-9 items-center gap-2 text-xs text-subline sm:flex"
        @click="open = true"
      >
        <SearchIcon class="size-3.5" />
        Search
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Q</Kbd>
        </KbdGroup>
      </Button>

      <slot name="actions" />

      <ColorModeToggle />
    </div>

    <ResponsiveCommandPalette v-model:open="open">
      <Command class="border-none bg-transparent shadow-none rounded-none sm:rounded-lg sm:border sm:bg-popover sm:shadow-md md:min-w-112.5">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>
            No results found.
          </CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem value="add assignment" @select="handleSelectAction(() => emit('add-assignment'))">
              <Plus class="mr-2 size-4" />
              <span>Create assignment</span>
            </CommandItem>
            <CommandItem value="add material" @select="handleSelectAction(() => emit('add-material'))">
              <Plus class="mr-2 size-4" />
              <span>Add material</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem value="overview" @select="handleSelectAction(() => emit('navigate', 'Overview'))">
              <span>Go to Overview</span>
            </CommandItem>
            <CommandItem value="assignments" @select="handleSelectAction(() => emit('navigate', 'Assignments'))">
              <span>Go to Assignments</span>
            </CommandItem>
            <CommandItem value="materials" @select="handleSelectAction(() => emit('navigate', 'Materials'))">
              <span>Go to Materials</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsiveCommandPalette>
  </header>
</template>