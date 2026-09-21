<script setup lang="ts">
  import { ArrowUpRight } from '@lucide/vue'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
  import type { StatItem } from '~/types/dashboard'

  defineProps<{ stats: StatItem[] }>()
</script>

<template>
  <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
    <Card
      v-for="(stat, i) in stats"
      :key="stat.label"
      class="animate-rise gap-0 py-0 border-border bg-card transition-colors hover:border-line-strong"
      :class="`delay-${i + 1}`"
    >
      <CardHeader class="flex h-10 flex-row items-center justify-between space-y-0 p-4 pb-0">
        <CardTitle class="text-xs font-normal text-muted-foreground leading-none">
          {{ stat.label }}
        </CardTitle>

        <NuxtLink
          v-if="stat.to"
          :to="stat.to"
          class="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          :aria-label="`Navigate to ${stat.label}`"
        >
          <ArrowUpRight class="size-4.5" />
        </NuxtLink>
        <span v-else class="size-6" />
      </CardHeader>

      <CardContent class="p-4 pt-3">
        <div class="text-3xl font-semibold tracking-tighter text-foreground">
          {{ stat.value }}
        </div>
        <CardDescription class="mt-1 text-[11px] text-muted-foreground">
          {{ stat.note }}
        </CardDescription>
      </CardContent>
    </Card>
  </div>
</template>