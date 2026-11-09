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
    <p class="text-[11px] text-subline">
      Preferences are saved, but notification delivery is not enabled yet.
    </p>
    <FieldGroup class="gap-4">
      <Field
        orientation="horizontal"
        class="items-center justify-between rounded-lg border border-line p-3"
      >
        <FieldContent class="gap-0.5">
          <FieldLabel for="settings-deadline-reminders" class="text-sm">Deadline reminders</FieldLabel>
          <FieldDescription class="text-xs">
            Show a notification when a task is approaching its due date.
          </FieldDescription>
        </FieldContent>
        <Switch id="settings-deadline-reminders" v-model:checked="settings.notifications.deadlineReminders" />
      </Field>

      <Field v-if="settings.notifications.deadlineReminders" class="gap-2 rounded-lg border border-line p-3">
        <FieldLabel for="settings-lead-time" class="text-sm">Lead time</FieldLabel>
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
      </Field>

      <Field
        orientation="horizontal"
        class="items-center justify-between rounded-lg border border-line p-3"
      >
        <FieldContent class="gap-0.5">
          <FieldLabel for="settings-weekly-digest" class="text-sm">Weekly digest</FieldLabel>
          <FieldDescription class="text-xs">
            Send a weekly summary of your tasks and materials.
          </FieldDescription>
        </FieldContent>
        <Switch id="settings-weekly-digest" v-model:checked="settings.notifications.weeklyDigest" />
      </Field>

      <Field
        orientation="horizontal"
        class="items-center justify-between rounded-lg border border-line p-3"
      >
        <FieldContent class="gap-0.5">
          <FieldLabel for="settings-material-updates" class="text-sm">Material updates</FieldLabel>
          <FieldDescription class="text-xs">
            Notify when new materials are added to your workspaces.
          </FieldDescription>
        </FieldContent>
        <Switch id="settings-material-updates" v-model:checked="settings.notifications.materialUpdates" />
      </Field>
    </FieldGroup>
  </div>
</template>
