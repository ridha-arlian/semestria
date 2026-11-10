<script setup lang="ts">
  import { LayoutDashboard, CircleSmall } from '@lucide/vue'
  import type { View } from '~/types'

  const api = useApi()
  const workspaces = computed(() => api.getWorkspaces())
  const { ready: workspacesReady, showSkeleton: workspacesPending } = useDataStatus('workspaces')

  const view = ref<View>('Overview')

  const mainNavItems = [
    { name: 'Dashboard' as const, icon: LayoutDashboard },
  ]

  const collapseWrap = 'grid grid-cols-[1fr] transition-[grid-template-columns] duration-200 ease-linear group-data-[collapsible=icon]:grid-cols-[0fr]'
  const menuButtonClass = 'w-full justify-start gap-3 px-3 py-2.5 text-[14px]'
</script>

<template>
  <SidebarProvider>
    <div class="min-h-screen w-full bg-paper text-ink flex">
      <LayoutsAppSidebar>
        <SidebarGroup class="p-0">
          <div :class="collapseWrap">
            <SidebarGroupLabel class="overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-subline whitespace-nowrap">
              Your Space
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent class="mt-2 group-data-[collapsible=icon]:mt-0">
            <SidebarMenu class="gap-2">
              <SidebarMenuItem
                v-for="item in mainNavItems"
                :key="item.name"
                class="flex justify-center overflow-hidden"
              >
                <SidebarMenuButton
                  is-active
                  :tooltip="item.name"
                  :class="menuButtonClass"
                >
                  <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.8" />

                  <div :class="collapseWrap">
                    <span class="overflow-hidden truncate whitespace-nowrap">
                      {{ item.name }}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup class="mt-4 p-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:select-none group-data-[collapsible=icon]:opacity-0">
          <SidebarGroupContent class="px-3">
            <Accordion type="single" collapsible default-value="semester" class="w-full">
              <AccordionItem value="semester" class="border-none">
                <AccordionTrigger class="h-auto py-0 flex items-center justify-start gap-1.5 hover:no-underline [&>svg]:translate-y-0 [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0 opacity-100 md:[&>svg]:opacity-0 md:hover:[&>svg]:opacity-100">
                  <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-subline hover:text-ink transition-colors">
                    Workspaces
                  </SidebarGroupLabel>
                </AccordionTrigger>

                <AccordionContent class="mt-2 pb-0 overflow-hidden">
                  <div class="flex flex-col gap-0.5">
                    <SkeletonsSidebarSkeleton v-if="workspacesPending" />

                    <template v-else-if="workspacesReady">
                      <Item
                        v-for="workspace in workspaces"
                        :key="workspace.id"
                        as-child
                        variant="default"
                        class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-subline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&:hover_svg]:fill-ink [&:hover_svg]:text-ink"
                      >
                        <NuxtLink :to="`/w/${workspace.publicId}`">
                          <ItemMedia variant="icon" class="size-5 shrink-0 justify-center bg-transparent border-none p-0">
                            <CircleSmall
                              class="size-5 transition-colors"
                              :class="workspace.active ? 'fill-ink text-ink' : 'fill-transparent text-subline'"
                            />
                          </ItemMedia>

                          <ItemContent class="p-0">
                            <ItemTitle
                              class="text-[13px] font-normal text-current transition-colors"
                              :class="workspace.active && 'text-ink'"
                            >
                              {{ workspace.name }}
                            </ItemTitle>
                          </ItemContent>
                        </NuxtLink>
                      </Item>

                      <Empty
                        v-if="!workspaces.length"
                        class="items-start gap-0 p-0 px-2 py-1.5 text-left md:p-0 md:px-2 md:py-1.5"
                      >
                        <EmptyHeader class="items-start gap-0">
                          <EmptyDescription class="text-[12px]">
                            No workspaces yet.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </template>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </LayoutsAppSidebar>

      <SidebarInset class="flex flex-1 flex-col">
        <LayoutsAppHeader :view="view" />

        <slot />
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>