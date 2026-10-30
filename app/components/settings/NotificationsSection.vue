<script setup lang="ts">
import { useSettings } from '~/composables/useSettings'

const { settings } = useSettings()

const leadTimeOptions = [
  { value: '1', label: '1 day before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: '1 week before' },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between rounded-lg border border-line p-3">
        <div class="flex flex-col gap-0.5">
          <Label for="settings-deadline-reminders" class="text-sm">Deadline reminders</Label>
          <p class="text-[12px] text-subline">
            Show a notification when a task is approaching its due date.
          </p>
        </div>
        <Switch id="settings-deadline-reminders" v-model:checked="settings.notifications.deadlineReminders" />
      </div>

      <div v-if="settings.notifications.deadlineReminders" class="flex flex-col gap-2 rounded-lg border border-line p-3">
        <Label for="settings-lead-time" class="text-sm">Lead time</Label>
        <Select v-model="settings.notifications.leadTime">
          <SelectTrigger id="settings-lead-time" class="w-full">
            <SelectValue placeholder="Select lead time" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="option in leadTimeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center justify-between rounded-lg border border-line p-3">
        <div class="flex flex-col gap-0.5">
          <Label for="settings-weekly-digest" class="text-sm">Weekly digest</Label>
          <p class="text-[12px] text-subline">
            Send a weekly summary of your tasks and materials.
          </p>
        </div>
        <Switch id="settings-weekly-digest" v-model:checked="settings.notifications.weeklyDigest" />
      </div>

      <div class="flex items-center justify-between rounded-lg border border-line p-3">
        <div class="flex flex-col gap-0.5">
          <Label for="settings-material-updates" class="text-sm">Material updates</Label>
          <p class="text-[12px] text-subline">
            Notify when new materials are added to your workspaces.
          </p>
        </div>
        <Switch id="settings-material-updates" v-model:checked="settings.notifications.materialUpdates" />
      </div>
    </div>
  </div>
</template>
