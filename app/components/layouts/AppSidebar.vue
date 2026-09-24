<script setup lang="ts">
  import { Settings } from '@lucide/vue'
  import { useSidebar } from '~/components/ui/sidebar'
  
  const { state, toggleSidebar, isMobile } = useSidebar()

  const collapseWrap = 'grid grid-cols-[1fr] transition-[grid-template-columns] duration-200 ease-linear group-data-[collapsible=icon]:grid-cols-[0fr]'
</script>

<template>
  <Sidebar collapsible="icon" class="bg-sidebar border-r border-line overflow-x-hidden">
    <SidebarHeader v-if="!isMobile" class="h-19 justify-center border-b border-line px-3 group-data-[collapsible=icon]:p-0 overflow-x-hidden">
      <TooltipProvider :delay-duration="0">
        <template v-if="state === 'expanded'">
          <div class="flex items-center justify-between w-full px-1.5 whitespace-nowrap">
            <div class="flex items-center pl-1">
              <IconsAppLogo class="size-9 w-auto text-ink" />
            </div>

            <Tooltip>
              <TooltipTrigger as-child>
                <SidebarTrigger class="text-subline hover:text-ink" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>
                  Close sidebar
                </p>
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
                class="size-9 rounded-md transition hover:bg-soft p-0"
                @click="toggleSidebar"
              >
                <IconsAppIcon class="size-9" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </SidebarHeader>

    <div v-else class="flex h-19 items-center px-4 border-b border-line">
      <IconsAppLogo class="size-8 w-auto text-ink" />
    </div>

    <SidebarContent class="px-3 py-6 group-data-[collapsible=icon]:px-0 overflow-x-hidden">
      <slot />
    </SidebarContent>

    <SidebarFooter class="h-16 justify-center border-t border-line px-3 group-data-[collapsible=icon]:p-0 overflow-x-hidden">
      <div class="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center whitespace-nowrap">
        <div class="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
          <Avatar class="size-8 shrink-0">
            <AvatarImage src="" alt="Ari Rahman" />
            <AvatarFallback class="bg-ink text-[11px] font-semibold text-paper">
              AR
            </AvatarFallback>
          </Avatar>

          <div :class="collapseWrap">
            <span class="text-xs font-medium text-strong truncate">
              Ari Rahman
            </span>
          </div>
        </div>

        <TooltipProvider :delay-duration="0">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-9 rounded-md text-subline hover:bg-card! hover:text-ink! shrink-0 group-data-[collapsible=icon]:hidden transition-colors duration-200 ease-linear"
              >
                <Settings class="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                Settings
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>