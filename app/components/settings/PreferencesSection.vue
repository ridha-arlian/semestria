<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '~/composables/useSettings'
import { useApi } from '~/composables/useApi'
import type { WeekStart, DefaultLanding } from '~/types'

const { settings } = useSettings()
const api = useApi()

const weekStartOptions = [
  { value: 'monday' as WeekStart, label: 'Monday' },
  { value: 'sunday' as WeekStart, label: 'Sunday' },
]

const defaultLandingOptions = [
  { value: 'dashboard' as DefaultLanding, label: 'Dashboard' },
  { value: 'last-active' as DefaultLanding, label: 'Last active workspace' },
]

const workspaces = computed(() => api.getWorkspaces())
const availableSlugs = computed(() => workspaces.value.map(w => w.slug))

function handleWorkspaceChange(value: unknown) {
  if (typeof value !== 'string')
    return
  const workspace = workspaces.value.find(w => w.slug === value)
  if (workspace)
    api.setActiveWorkspace(workspace.id)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <Label for="settings-week-start" class="text-sm">Start week on</Label>
      <Select v-model="settings.preferences.weekStartsOn">
        <SelectTrigger id="settings-week-start" class="w-full">
          <SelectValue placeholder="Select week start" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="option in weekStartOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p class="text-[11px] text-subline">
        Affects all calendars in the app.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="settings-default-landing" class="text-sm">Default landing page</Label>
      <Select v-model="settings.preferences.defaultLanding">
        <SelectTrigger id="settings-default-landing" class="w-full">
          <SelectValue placeholder="Select default landing" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="option in defaultLandingOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p class="text-[11px] text-subline">
        When you open the app, it will navigate to this page.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="settings-active-workspace" class="text-sm">Active workspace</Label>
      <Select
        v-model="settings.preferences.activeWorkspaceSlug"
        :disabled="availableSlugs.length === 0"
        @update:model-value="handleWorkspaceChange"
      >
        <SelectTrigger id="settings-active-workspace" class="w-full">
          <SelectValue :placeholder="availableSlugs.length === 0 ? 'No workspace' : 'Select workspace'" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="slug in availableSlugs" :key="slug" :value="slug">
              {{ workspaces.find(w => w.slug === slug)?.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p class="text-[11px] text-subline">
        Selecting a workspace marks it as active.
      </p>
    </div>
  </div>
</template>
