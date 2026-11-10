import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { useHydratedCache, useErrorCache } from './apiCache'

/** Delay before a pending region swaps its content for a skeleton. */
const SKELETON_DELAY_MS = 150

export interface DataStatus {
  ready: ComputedRef<boolean>
  pending: ComputedRef<boolean>
  showSkeleton: ComputedRef<boolean>
  error: ComputedRef<string | null>
}

/**
 * Read the status of one cache key for a page region.
 *
 * `showSkeleton` waits 150 ms before turning on so fast responses render
 * directly without a skeleton flash. It turns off as soon as the region is
 * ready or errored. Never true during SSR: server HTML always contains the
 * awaited data.
 */
export function useDataStatus(key: MaybeRefOrGetter<string>): DataStatus {
  const hydrated = useHydratedCache()
  const errors = useErrorCache()

  const ready = computed(() => hydrated.value[toValue(key)] === true)
  const error = computed(() => errors.value[toValue(key)] ?? null)
  const pending = computed(() => !ready.value && !error.value)

  const elapsed = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  if (import.meta.client) {
    watch(pending, (value) => {
      clearTimer()
      if (value) {
        timer = setTimeout(() => {
          elapsed.value = true
          timer = null
        }, SKELETON_DELAY_MS)
      }
      else {
        elapsed.value = false
      }
    }, { immediate: true })
  }

  onScopeDispose(clearTimer)

  const showSkeleton = computed(() => import.meta.client && elapsed.value)

  return { ready, pending, showSkeleton, error }
}
