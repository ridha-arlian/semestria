<script lang="ts" setup>
import type { DrawerContentEmits, DrawerContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  DrawerContent,
  DrawerHandle,
  DrawerPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { useDrawerSwipeProgress } from "@/composables/useDrawerSwipeProgress"
import { cn } from "@/lib/utils"
import DrawerOverlay from "./DrawerOverlay.vue"

defineOptions({
  inheritAttrs: false,
})

// Keeps the scrim in step with the panel while the sheet is dragged.
const { onPointerDown } = useDrawerSwipeProgress()

const props = defineProps<DrawerContentProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<DrawerContentEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      @pointerdown="onPointerDown"
      :class="cn(
        'group/drawer-content bg-background fixed z-50 flex h-auto flex-col',
        'transform-[translate3d(var(--drawer-swipe-movement-x,0px),var(--drawer-swipe-movement-y,0px),0)]',
        // The Vaul curve is steep at the start, so 500ms still lands softly.
        // `--tw-ease` also drives the enter/exit keyframes below.
        'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-swiping:select-none',
        // A grab mid-entrance must drop the keyframe and follow the finger.
        'data-swiping:animate-none data-swiping:will-change-transform data-[state=open]:will-change-transform',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-lg data-[swipe-direction=up]:data-[state=open]:slide-in-from-top data-[swipe-direction=up]:data-[state=closed]:slide-out-to-top',
        'data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:rounded-t-lg data-[swipe-direction=down]:data-[state=open]:slide-in-from-bottom data-[swipe-direction=down]:data-[state=closed]:slide-out-to-bottom',
        'data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:sm:max-w-sm data-[swipe-direction=right]:data-[state=open]:slide-in-from-right data-[swipe-direction=right]:data-[state=closed]:slide-out-to-right',
        'data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:sm:max-w-sm data-[swipe-direction=left]:data-[state=open]:slide-in-from-left data-[swipe-direction=left]:data-[state=closed]:slide-out-to-left',
        props.class,
      )"
    >
      <DrawerHandle class="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[swipe-direction=down]/drawer-content:block" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
