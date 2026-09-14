<script setup lang="ts">
  import { FileText, Plus, SearchIcon, SquareCheck } from '@lucide/vue'
  import { useDateFormat, useMagicKeys, useMounted, whenever } from '@vueuse/core'
  import { computed, ref } from 'vue'
  import ResponsiveCommandPalette from '@/components/ResponsiveCommandPalette.vue'
  import { Button } from '@/components/ui/button'
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
  import { Kbd, KbdGroup } from '@/components/ui/kbd'
  import { useSidebar } from '@/components/ui/sidebar'
  import AppIcon from '~/components/icons/AppIcon.vue'
  import type { View } from '~/types/dashboard'

  const props = defineProps<{
    view: View
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
  const formattedDate = useDateFormat(
    computed(() => (isMounted.value ? new Date() : undefined)),
    'dddd, MMMM D, YYYY',
    { locales: 'en-US' }
  )

  const headingDesktop = computed(() => (props.view === 'Overview' ? 'Good morning, Ari.' : props.view))
  const headingMobile = computed(() => props.view)

  function handleSelectAction(action: () => void) {
    open.value = false
    action()
  }
</script>

<template>
  <header class="sticky top-0 z-10 flex h-19 items-center justify-between border-b border-neutral-200 bg-paper/95 px-5 backdrop-blur md:px-9">
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
        <p class="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400 md:block">
          {{ formattedDate || '...' }}
        </p>

        <h1 class="text-base font-semibold tracking-[-0.03em] md:hidden">
          {{ headingMobile }}
        </h1>

        <h1 class="hidden text-xl font-semibold tracking-[-0.03em] md:mt-1 md:block">
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
        <SearchIcon class="size-4 text-neutral-500" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="hidden h-9 items-center gap-2 text-xs text-neutral-500 sm:flex"
        @click="open = true"
      >
        <SearchIcon class="size-3.5" />
        Search
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Q</Kbd>
        </KbdGroup>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="icon" class="size-9">
            <Plus class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem @click="emit('add-assignment')">
            <SquareCheck class="mr-2 size-4 text-neutral-500" />
            <span>New Assignment</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('add-material')">
            <FileText class="mr-2 size-4 text-neutral-500" />
            <span>New Material</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
              <span>
                Create assignment
              </span>
            </CommandItem>
            <CommandItem value="add material" @select="handleSelectAction(() => emit('add-material'))">
              <Plus class="mr-2 size-4" />
              <span>
                Add material
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem value="overview" @select="handleSelectAction(() => emit('navigate', 'Overview'))">
              <span>
                Go to Overview
              </span>
            </CommandItem>
            <CommandItem value="assignments" @select="handleSelectAction(() => emit('navigate', 'Assignments'))">
              <span>
                Go to Assignments
              </span>
            </CommandItem>
            <CommandItem value="materials" @select="handleSelectAction(() => emit('navigate', 'Materials'))">
              <span>
                Go to Materials
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsiveCommandPalette>
  </header>
</template>