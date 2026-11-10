<script setup lang="ts">
  import { BookOpen, Plus, SearchIcon, Settings as SettingsIcon, SquareCheck } from '@lucide/vue'
  import { useDateFormat, useMagicKeys, useMounted, whenever } from '@vueuse/core'
  import { useSidebar } from '~/components/ui/sidebar'
  import { useSettings } from '~/composables/useSettings'
  import type { BreadcrumbEntry, Material, Task, View } from '~/types'

  const { view, breadcrumbs = [] } = defineProps<{
    view: View
    breadcrumbs?: BreadcrumbEntry[]
  }>()

  const emit = defineEmits<{
    'add-task': []
    'add-material': []
    'navigate': [view: View]
  }>()

  const { toggleSidebar } = useSidebar()
  const open = ref(false)
  const { settings, openSettings } = useSettings()
  const api = useApi()

  // Search targets come from the caches hydrated by the global data middleware.
  const workspaceById = computed(() => new Map(api.getWorkspaces().map(w => [w.id, w])))
  const taskResults = computed(() => api.getTaskState().value.slice(0, 20))
  const materialResults = computed(() => api.getMaterialState().value.slice(0, 20))

  function openTask(task: Task) {
    const workspace = workspaceById.value.get(task.workspaceId)
    if (!workspace)
      return
    handleSelectAction(() => navigateTo(`/workspaces/${workspace.slug}/tasks/${task.id}`))
  }

  function openMaterial(material: Material) {
    const workspace = workspaceById.value.get(material.workspaceId)
    if (!workspace)
      return
    handleSelectAction(() => navigateTo(`/workspaces/${workspace.slug}/materials/${material.id}`))
  }

  const { meta_q, ctrl_q } = useMagicKeys()
  whenever(() => meta_q?.value || ctrl_q?.value, () => {
    open.value = !open.value
  })

  const isMounted = useMounted()
  const formattedDate = useDateFormat(computed(() => (isMounted.value ? new Date() : undefined)), 'dddd, MMMM D, YYYY', { locales: 'en-US' })

  const { ready: settingsReady, error: settingsError } = useDataStatus('settings')
  // The name comes from server settings; hold the placeholder until it lands
  // instead of flashing the "you" fallback.
  const showNameSkeleton = computed(() => !settingsReady.value && !settingsError.value)

  const headingDesktop = computed(() => {
    // Rendered on the server too, so keep the fallback neutral and swap in the
    // time-based greeting once mounted to avoid a hydration mismatch.
    if (!isMounted.value)
      return 'Welcome back.'
    const hour = new Date().getHours()
    const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    return `Good ${part},`
  })
  const headingName = computed(() => (settings.value.profile.name || 'you').split(' ')[0])
  const headingMobile = computed(() => view)

  function handleSelectAction(action: () => void) {
    open.value = false
    action()
  }

  function handleSettings() {
    open.value = false
    openSettings()
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
        <IconsAppIcon class="size-8" />
      </Button>

      <div>
        <p v-if="!breadcrumbs.length" class="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-subline md:block">
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
          <template v-if="!isMounted">
            Welcome back.
          </template>
          <template v-else>
            {{ headingDesktop }}
            <Skeleton v-if="showNameSkeleton" class="inline-block h-4 w-20 align-middle" />
            <template v-else>
              {{ headingName }}
            </template>.
          </template>
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
            <CommandItem value="add task" @select="handleSelectAction(() => emit('add-task'))">
              <Plus class="mr-2 size-4" />
              <span>Create task</span>
            </CommandItem>
            <CommandItem value="add material" @select="handleSelectAction(() => emit('add-material'))">
              <Plus class="mr-2 size-4" />
              <span>Add material</span>
            </CommandItem>
            <CommandItem value="settings" @select="handleSettings">
              <SettingsIcon class="mr-2 size-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup v-if="taskResults.length" heading="Tasks">
            <CommandItem
              v-for="task in taskResults"
              :key="`task-${task.id}`"
              :value="`${task.task} ${task.course} ${task.id}`"
              @select="openTask(task)"
            >
              <SquareCheck class="mr-2 size-4" />
              <span class="truncate">{{ task.task }}</span>
              <span class="ml-auto shrink-0 text-xs text-subline">{{ task.course }}</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup v-if="materialResults.length" heading="Materials">
            <CommandItem
              v-for="material in materialResults"
              :key="`material-${material.id}`"
              :value="`${material.title} ${material.course} ${material.id}`"
              @select="openMaterial(material)"
            >
              <BookOpen class="mr-2 size-4" />
              <span class="truncate">{{ material.title }}</span>
              <span class="ml-auto shrink-0 text-xs text-subline">{{ material.course }}</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem value="overview" @select="handleSelectAction(() => emit('navigate', 'Overview'))">
              <span>Go to Overview</span>
            </CommandItem>
            <CommandItem value="tasks" @select="handleSelectAction(() => emit('navigate', 'Tasks'))">
              <span>Go to Tasks</span>
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