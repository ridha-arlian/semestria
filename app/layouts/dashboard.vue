<script setup lang="ts">
  import { LayoutDashboard, CircleSmall } from '@lucide/vue'
  import AppSidebar from '~/components/dashboard/AppSidebar.vue'
  import AppHeader from '~/components/dashboard/AppHeader.vue'
  import type { View } from '~/types/dashboard'

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
      <AppSidebar>
        <SidebarGroup class="p-0">
          <div :class="collapseWrap">
            <SidebarGroupLabel class="overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-subline whitespace-nowrap">
              Your Space
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent class="mt-2 group-data-[collapsible=icon]:mt-0">
            <SidebarMenu class="space-y-1">
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
                <AccordionTrigger class="h-auto py-0 flex items-center justify-start gap-1.5 hover:no-underline [&>svg]:transition-all [&>svg]:duration-200 [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0 opacity-100 md:[&>svg]:opacity-0 md:hover:[&>svg]:opacity-100">
                  <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-subline hover:text-ink transition-colors">
                    Workspaces
                  </SidebarGroupLabel>
                </AccordionTrigger>

                <AccordionContent class="mt-2 pb-0 overflow-hidden">
                  <div class="flex flex-col gap-0.5">
                    <Item
                      v-for="semester in ['Fall 2026', 'Spring 2026', 'Fall 2025']"
                      :key="semester"
                      variant="default"
                      class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-subline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&:hover_svg]:fill-ink [&:hover_svg]:text-ink"
                    >
                      <ItemMedia variant="icon" class="size-5 shrink-0 justify-center bg-transparent border-none p-0">
                        <CircleSmall class="size-5 transition-colors fill-transparent text-subline" />
                      </ItemMedia>

                      <ItemContent class="p-0">
                        <ItemTitle class="text-[13px] font-normal text-current transition-colors">
                          {{ semester }}
                        </ItemTitle>
                      </ItemContent>
                    </Item>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </AppSidebar>

      <div class="flex-1 overflow-y-auto">
        <AppHeader :view="view" />

        <slot />
      </div>
    </div>
  </SidebarProvider>
</template>