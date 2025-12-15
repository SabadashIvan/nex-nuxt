/**
 * Debounce composable for delaying function execution
 */

import { ref, watch, type Ref } from 'vue'

/**
 * Debounce a value
 */
export function useDebouncedRef<T>(value: Ref<T>, delay = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}

/**
 * Create a debounced function
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay = 300
): { 
  debounced: (...args: Parameters<T>) => void
  cancel: () => void
  pending: Ref<boolean>
} {
  let timeout: ReturnType<typeof setTimeout> | null = null
  const pending = ref(false)

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    pending.value = true
    timeout = setTimeout(() => {
      fn(...args)
      pending.value = false
    }, delay)
  }

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    pending.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancel()
  })

  return { debounced, cancel, pending }
}

/**
 * Throttle a function (execute at most once per interval)
 */
export function useThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  interval = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= interval) {
      lastCall = now
      fn(...args)
    }
  }
}

