<script setup lang="ts">
  import { X } from '@lucide/vue'
  import { ref, watch } from 'vue'
  import type { ModalType } from '~/types/dashboard'

  const props = defineProps<{
    open: boolean
    modalType: ModalType
  }>()

  const emit = defineEmits<{
    close: []
    submit: [payload: { task: string, course: string, due: string }]
  }>()

  const task = ref('')
  const course = ref('')
  const due = ref('')

  watch(() => props.open, (isOpen) => {
    if (isOpen) {
      task.value = ''
      course.value = ''
      due.value = ''
    }
  })

  function handleSubmit() {
    if (!task.value.trim() || !course.value.trim())
      return
    emit('submit', { task: task.value, course: course.value, due: due.value })
  }
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-30 grid place-items-center bg-neutral-900/20 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-2xl">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
            New {{ modalType }}
          </p>
          <h2 class="mt-2 text-lg font-semibold">
            Make it part of the plan.
          </h2>
        </div>
        <button class="text-neutral-400 hover:text-neutral-900" @click="emit('close')">
          <X class="size-4" />
        </button>
      </div>
      <div class="mt-6 space-y-4">
        <label class="block">
          <span class="text-xs font-medium">{{ modalType === 'assignment' ? 'Task name' : 'Title' }}</span>
          <input
            v-model="task"
            autofocus
            class="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
            placeholder="e.g. Read chapter 4"
          >
        </label>
        <label class="block">
          <span class="text-xs font-medium">Course</span>
          <input
            v-model="course"
            class="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
            placeholder="e.g. Design Research"
          >
        </label>
        <label v-if="modalType === 'assignment'" class="block">
          <span class="text-xs font-medium">Due date <span class="font-normal text-neutral-400">(optional)</span></span>
          <input
            v-model="due"
            class="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
            placeholder="e.g. Sep 24, 2026"
          >
        </label>
      </div>
      <div class="mt-7 flex justify-end gap-2">
        <button class="rounded-md px-4 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100" @click="emit('close')">
          Cancel
        </button>
        <button
          class="rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!task.trim() || !course.trim()"
          @click="handleSubmit"
        >
          Add {{ modalType }}
        </button>
      </div>
    </div>
  </div>
</template>