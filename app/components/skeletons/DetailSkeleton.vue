<script setup lang="ts">
  import { Card, CardContent } from '@/components/ui/card'
  import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div aria-hidden="true" class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <Skeleton class="h-8 w-64 max-w-full" />
      <Skeleton class="h-4 w-40 max-w-full" />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardContent class="flex flex-col gap-3">
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="h-3 w-full" />
          <Skeleton class="h-3 w-5/6" />
        </CardContent>
      </Card>

      <div class="flex flex-col gap-6">
        <Card v-for="index in 3" :key="index">
          <CardContent class="flex flex-col gap-3">
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
