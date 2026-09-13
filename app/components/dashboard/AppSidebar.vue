<script setup lang="ts">
  import { BookOpen, Check, CircleHelp, LayoutDashboard, Settings2 } from '@lucide/vue'
  import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { Progress } from '@/components/ui/progress'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { Button } from '@/components/ui/button'
  import AppIcon from '~/components/icons/AppIcon.vue'
  import AppLogo from '~/components/icons/AppLogo.vue'
  import type { View } from '~/types/dashboard'

  const props = defineProps<{
    view: View
    assignmentsCount: number
  }>()

  const emit = defineEmits<{
    'update:view': [value: View]
  }>()

  const { state, toggleSidebar, isMobile } = useSidebar()

  const mainNavItems = [
    { name: 'Overview' as const, icon: LayoutDashboard },
    { name: 'Assignments' as const, icon: Check },
    { name: 'Materials' as const, icon: BookOpen },
  ]

  const bottomNavItems = [
    { name: 'Settings' as const, icon: Settings2 },
    { name: 'Help & feedback' as const, icon: CircleHelp },
  ]
  
  const collapseWrap = 'grid grid-cols-[1fr] transition-[grid-template-columns] duration-200 ease-linear group-data-[collapsible=icon]:grid-cols-[0fr]'
  const menuButtonClass = 'w-full justify-start gap-3 rounded-md px-3 py-2.5 text-[14px] transition-[padding,gap,color,background-color] duration-200 ease-linear text-neutral-500 hover:bg-white/70 hover:text-neutral-900 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto'
  const menuButtonActiveClass = 'data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-neutral-200'
</script>

<template>
  <Sidebar collapsible="icon" class="bg-[#f5f5f3] border-r border-neutral-200 overflow-x-hidden">
    <SidebarHeader v-if="!isMobile" class="h-19 justify-center border-b border-neutral-200 px-3 group-data-[collapsible=icon]:p-0 overflow-x-hidden">
      <TooltipProvider :delay-duration="0">
        <template v-if="state === 'expanded'">
          <div class="flex items-center justify-between w-full px-1.5 whitespace-nowrap">
            <div class="flex items-center pl-1">
              <AppLogo class="size-9 w-auto text-neutral-900" />
            </div>

            <Tooltip>
              <TooltipTrigger as-child>
                <SidebarTrigger class="text-neutral-500 hover:text-neutral-900" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Close sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </template>

        <div v-else class="flex items-center justify-center w-full h-full">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-9 rounded-md transition hover:bg-neutral-200/60 p-0"
                @click="toggleSidebar"
              >
                <AppIcon class="size-9" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </SidebarHeader>

    <div v-else class="flex h-19 items-center px-4 border-b border-neutral-200">
      <AppLogo class="size-8 w-auto text-neutral-900" />
    </div>

    <SidebarContent class="px-3 py-6 group-data-[collapsible=icon]:px-0 overflow-x-hidden">
      <SidebarGroup class="p-0">
        <div :class="collapseWrap">
          <SidebarGroupLabel class="overflow-hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 whitespace-nowrap">
            Workspace
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
                :is-active="props.view === item.name"
                :tooltip="item.name"
                :class="[menuButtonClass, menuButtonActiveClass]"
                @click="emit('update:view', item.name)"
              >
                <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.8" />

                <div :class="collapseWrap">
                  <span class="overflow-hidden truncate whitespace-nowrap">
                    {{ item.name }}
                  </span>
                </div>

                <div v-if="item.name === 'Assignments'" :class="['ml-auto', collapseWrap]">
                  <SidebarMenuBadge class="overflow-hidden rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-normal text-neutral-600 whitespace-nowrap">
                    {{ props.assignmentsCount }}
                  </SidebarMenuBadge>
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
                <SidebarGroupLabel class="p-0 h-auto cursor-pointer text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 hover:text-neutral-600 transition-colors">
                  This semester
                </SidebarGroupLabel>
              </AccordionTrigger>

              <AccordionContent class="mt-4 pb-0 overflow-hidden">
                <Card class="bg-white border-neutral-200 shadow-none p-3 gap-0 overflow-hidden">
                  <CardHeader class="p-0 flex flex-row items-center justify-between space-y-0">
                    <CardTitle class="text-xs font-semibold text-neutral-900">
                      Fall 2026
                    </CardTitle>
                  </CardHeader>

                  <CardContent class="p-0 mt-1">
                    <p class="text-[11px] text-neutral-400 whitespace-nowrap">
                      Aug 24 — Dec 18, 2026
                    </p>

                    <Progress :model-value="42" class="mt-3 h-1 bg-neutral-100" />

                    <p class="mt-1.5 text-[10px] text-neutral-400 whitespace-nowrap">
                      Week 3 of 16
                    </p>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="mt-auto p-0">
        <SidebarMenu class="space-y-1">
          <SidebarMenuItem
            v-for="item in bottomNavItems"
            :key="item.name"
            class="flex justify-center overflow-hidden"
          >
            <SidebarMenuButton
              :is-active="props.view === item.name"
              :tooltip="item.name"
              :class="[menuButtonClass, menuButtonActiveClass]"
              @click="emit('update:view', item.name)"
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
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t border-neutral-200 p-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3 overflow-x-hidden">
      <div class="flex items-center gap-3 w-full justify-start transition-[gap] duration-200 ease-linear group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 whitespace-nowrap">
        <div class="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
          AR
        </div>

        <div :class="collapseWrap">
          <div class="overflow-hidden min-w-0">
            <p class="text-xs font-semibold text-neutral-900 truncate">
              Ari Rahman
            </p>
            <p class="text-[10px] text-neutral-400 truncate">
              Personal workspace
            </p>
          </div>
        </div>

        <!-- <MoreHorizontal class="ml-auto size-4 shrink-0 cursor-pointer text-neutral-400 group-data-[collapsible=icon]:hidden" /> -->
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
