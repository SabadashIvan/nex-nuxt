/**
 * Pagination composable for managing paginated data
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Pagination, PaginationMeta } from '~/types'

export interface UsePaginationOptions {
  initialPage?: number
  initialPerPage?: number
  onPageChange?: (page: number) => void
}

export interface UsePaginationReturn {
  page: Ref<number>
  perPage: Ref<number>
  total: Ref<number>
  lastPage: Ref<number>
  
  // Computed
  hasNextPage: ComputedRef<boolean>
  hasPrevPage: ComputedRef<boolean>
  isFirstPage: ComputedRef<boolean>
  isLastPage: ComputedRef<boolean>
  pageCount: ComputedRef<number>
  offset: ComputedRef<number>
  pageRange: ComputedRef<number[]>
  
  // Methods
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  setPerPage: (perPage: number) => void
  updateFromMeta: (meta: PaginationMeta) => void
  reset: () => void
  getState: () => Pagination
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { 
    initialPage = 1, 
    initialPerPage = 20,
    onPageChange,
  } = options

  // State
  const page = ref(initialPage)
  const perPage = ref(initialPerPage)
  const total = ref(0)
  const lastPage = ref(1)

  // Computed
  const hasNextPage = computed(() => page.value < lastPage.value)
  const hasPrevPage = computed(() => page.value > 1)
  const isFirstPage = computed(() => page.value === 1)
  const isLastPage = computed(() => page.value >= lastPage.value)
  const pageCount = computed(() => lastPage.value)
  const offset = computed(() => (page.value - 1) * perPage.value)

  // Generate page range for pagination UI
  const pageRange = computed(() => {
    const range: number[] = []
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)
    
    let start = Math.max(1, page.value - half)
    let end = Math.min(lastPage.value, start + maxVisible - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    
    return range
  })

  // Methods
  function nextPage() {
    if (hasNextPage.value) {
      page.value++
      onPageChange?.(page.value)
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      page.value--
      onPageChange?.(page.value)
    }
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= lastPage.value && newPage !== page.value) {
      page.value = newPage
      onPageChange?.(page.value)
    }
  }

  function setPerPage(newPerPage: number) {
    perPage.value = newPerPage
    page.value = 1 // Reset to first page when changing page size
    onPageChange?.(page.value)
  }

  function updateFromMeta(meta: PaginationMeta) {
    page.value = meta.current_page
    perPage.value = meta.per_page
    total.value = meta.total
    lastPage.value = meta.last_page
  }

  function reset() {
    page.value = initialPage
    perPage.value = initialPerPage
    total.value = 0
    lastPage.value = 1
  }

  function getState(): Pagination {
    return {
      page: page.value,
      perPage: perPage.value,
      total: total.value,
      lastPage: lastPage.value,
    }
  }

  return {
    page,
    perPage,
    total,
    lastPage,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageCount,
    offset,
    pageRange,
    nextPage,
    prevPage,
    goToPage,
    setPerPage,
    updateFromMeta,
    reset,
    getState,
  }
}

