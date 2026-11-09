<script setup lang="ts">
import { Monitor, Moon, RotateCcw, Sun } from '@lucide/vue'
import ColorPicker from '~/components/color-picker/ColorPicker.vue'
import { useSettings } from '~/composables/useSettings'
import { useThemeTransition } from '~/composables/useThemeTransition'
import { themePresets, presetAccent, normalizeHex, buildThemePreview } from '~/utils/settingsTheme'
import type { ThemeTransitionOrigin } from '~/composables/useThemeTransition'
import type { ThemePresetId } from '~/types'

const { settings } = useSettings()
const colorMode = useColorMode()
const { run: runThemeTransition } = useThemeTransition()

let modeOrigin: ThemeTransitionOrigin | null = null

// Single source of truth for the light/dark/system preference. The header
// toggle only flips between light and dark; this one can also follow the OS.
const modePreference = computed({
  get: () => colorMode.preference || 'system',
  set: (value: string) => {
    if (!value || value === colorMode.preference)
      return
    const next = value as 'light' | 'dark' | 'system'
    const origin = modeOrigin ?? undefined
    modeOrigin = null
    runThemeTransition(() => {
      colorMode.preference = next
    }, origin)
  },
})

function rememberModeOrigin(event: MouseEvent) {
  modeOrigin = { x: event.clientX, y: event.clientY }
}

const isCustom = computed(() => settings.value.appearance.preset === 'custom')
const currentAccent = computed(() => presetAccent(settings.value.appearance.preset, settings.value.appearance.customColor))
const customColorOpen = ref(false)
const pickerColor = ref(currentAccent.value)
const canApply = computed(() => {
  const draft = normalizeHex(pickerColor.value)
  return !!draft && draft !== normalizeHex(currentAccent.value)
})
const preview = computed(() => {
  const accent = normalizeHex(pickerColor.value) ?? currentAccent.value
  return buildThemePreview(accent, colorMode.value === 'dark')
})

function selectPreset(id: ThemePresetId) {
  settings.value.appearance.preset = id
}

function onPresetChange(value: unknown) {
  if (typeof value === 'string')
    selectPreset(value as ThemePresetId)
}

function resetTheme() {
  settings.value.appearance.preset = 'mono'
  settings.value.appearance.customColor = '#2563eb'
}

function handleCustomColorOpen(open: boolean) {
  customColorOpen.value = open
  if (open)
    pickerColor.value = currentAccent.value
}

function handlePickerPreview(color: unknown) {
  if (typeof color === 'string')
    pickerColor.value = color
}

function handlePickerInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target?.name !== 'hex')
    return
  const hex = normalizeHex(target.value)
  if (hex)
    pickerColor.value = hex
}

function handlePickerKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement | null
  if (event.key !== 'Enter' || !(target instanceof HTMLInputElement))
    return
  if (!target.closest('.bg-vuelor-surface'))
    return
  event.preventDefault()
  target.blur()
}

function applyCustomColor() {
  const hex = normalizeHex(pickerColor.value)
  if (!hex)
    return
  settings.value.appearance.preset = 'custom'
  settings.value.appearance.customColor = hex
  customColorOpen.value = false
}

function cancelCustomColor() {
  customColorOpen.value = false
}
</script>

<template>
  <FieldGroup class="gap-6">
    <Field class="gap-2">
      <FieldLabel class="text-sm">Mode</FieldLabel>
      <div class="w-fit" @click.capture="rememberModeOrigin">
        <ToggleGroup
          v-model="modePreference"
          type="single"
          variant="outline"
          size="sm"
          class="w-fit"
        >
          <ToggleGroupItem value="light" class="gap-1.5">
            <Sun />
            <span class="text-xs">Light</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" class="gap-1.5">
            <Moon />
            <span class="text-xs">Dark</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="system" class="gap-1.5">
            <Monitor />
            <span class="text-xs">System</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <FieldDescription class="text-[11px]">
        System follows your device appearance.
      </FieldDescription>
    </Field>

    <Field class="gap-2">
      <FieldLabel class="text-sm">Theme preset</FieldLabel>
      <ToggleGroup
        type="single"
        variant="outline"
        :spacing="2"
        class="grid w-full grid-cols-3 sm:grid-cols-6"
        :model-value="settings.appearance.preset"
        @update:model-value="onPresetChange"
      >
        <ToggleGroupItem
          v-for="preset in themePresets"
          :key="preset.id"
          :value="preset.id"
          class="flex h-auto w-auto flex-col items-center gap-1.5 rounded-lg p-2 whitespace-normal hover:border-line-strong data-[state=on]:border-ink! data-[state=on]:bg-soft!"
        >
          <div
            class="size-4 rounded-full border border-line-strong"
            :style="{ backgroundColor: preset.light ?? '#18181b' }"
          />
          <span class="text-[11px] text-subline">{{ preset.name }}</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <FieldDescription class="text-[11px]">
        Theme accent changes instantly, including surfaces.
      </FieldDescription>
    </Field>

    <Field
      orientation="horizontal"
      class="items-center justify-between gap-3 rounded-lg border border-line p-3 transition-colors hover:border-line-strong"
      :class="isCustom ? 'border-ink bg-soft' : 'bg-paper'"
    >
      <FieldLabel class="text-sm">Custom</FieldLabel>
        <Popover :open="customColorOpen" @update:open="handleCustomColorOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="gap-2"
              :aria-label="`Choose custom accent color, current ${currentAccent}`"
            >
              <span
                class="size-4 rounded-full border border-line-strong"
                :style="{ backgroundColor: currentAccent }"
              />
              <span class="font-mono text-[11px] tabular-nums">{{ currentAccent }}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            class="w-auto border-0 bg-transparent p-0 shadow-none"
            align="end"
            :side-offset="8"
          >
            <ColorPicker
              :model-value="pickerColor"
              format="hex"
              class="text-foreground"
              @update:model-value="handlePickerPreview"
              @input="handlePickerInput"
              @keydown="handlePickerKeydown"
            >
              <template #footer>
                <div class="flex flex-col gap-3 pt-1">
                  <Separator />
                  <div class="grid grid-cols-3 gap-1.5" aria-hidden="true">
                    <div
                      class="flex h-14 flex-col justify-between rounded-md border border-line p-2"
                      :style="{ backgroundColor: preview.background }"
                    >
                      <span class="text-[10px] font-medium text-ink">Page</span>
                      <span class="text-[9px] text-subline">Text</span>
                    </div>
                    <div
                      class="flex h-14 flex-col justify-between rounded-md border border-line p-2"
                      :style="{ backgroundColor: preview.card }"
                    >
                      <span class="text-[10px] font-medium text-ink">Card</span>
                      <span class="text-[9px] text-subline">Surface</span>
                    </div>
                    <div
                      class="flex h-14 items-center justify-center rounded-md px-2 text-center text-[10px] font-medium"
                      :style="{ backgroundColor: preview.primary, color: preview.primaryForeground }"
                    >
                      Primary
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" @click="cancelCustomColor">
                      Cancel
                    </Button>
                    <Button size="sm" :disabled="!canApply" @click="applyCustomColor">
                      Apply
                    </Button>
                  </div>
                </div>
              </template>
            </ColorPicker>
          </PopoverContent>
        </Popover>
    </Field>

    <Field
      orientation="horizontal"
      class="items-center justify-between rounded-lg border border-line p-3"
    >
      <FieldContent class="gap-0.5">
        <FieldLabel class="text-sm">Reset to default</FieldLabel>
        <FieldDescription class="text-xs">
          Revert to the built‑in monochrome theme.
        </FieldDescription>
      </FieldContent>
      <Button variant="outline" size="sm" @click="resetTheme">
        <RotateCcw class="mr-1.5 size-3.5" />
        Reset
      </Button>
    </Field>
  </FieldGroup>
</template>
