<script lang="ts" setup>
import type { AcceptableValue } from 'reka-ui'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

const props = defineProps<{
  label?: string
  placeholder?: string,
  disabled?: boolean,
  class?: string,
  options?: string[],
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <SelectRoot
    :disabled="props.disabled"
    :model-value="props.modelValue"
    @update:model-value="(value: AcceptableValue) => emit('update:modelValue', value as string)"
  >
    <SelectTrigger
      :aria-label="props.label"
      :class="props.class"
      class="inline-flex h-6 pl-[7px] items-center justify-between rounded-[5px] text-[11px] leading-none gap-[5px] border border-vuelor-border focus:outline-none focus:border-vuelor-primary"
    >
      <SelectValue :placeholder="props.placeholder" />
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708"
        />
      </svg>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="z-[100] w-[96px] rounded-[13px] border border-line bg-popover px-2 text-popover-foreground shadow-md"
        :side-offset="5"
      >
        <SelectViewport class="py-2">
          <SelectItem
            v-for="(option, index) in props.options"
            :key="index"
            :value="option"
            class="relative flex h-[25px] select-none items-center rounded-[5px] pl-6 pr-2 text-xs leading-none text-popover-foreground data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground data-[highlighted]:bg-soft data-[highlighted]:outline-none"
          >
            <SelectItemIndicator class="absolute left-1 inline-flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path
                  fill="currentColor"
                  fill-opacity="1"
                  fill-rule="nonzero"
                  stroke="none"
                  d="M13.207 5.207 7 11.414 3.292 7.707l1.415-1.414L7 8.586l4.793-4.793z"
                />
              </svg>
            </SelectItemIndicator>
            <SelectItemText>
              {{ option }}
            </SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
