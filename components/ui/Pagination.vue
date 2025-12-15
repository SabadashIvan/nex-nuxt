<script setup lang="ts">
/**
 * Pagination component
 */
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage: number
  totalPages: number
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5,
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

const hasPrev = computed(() => props.currentPage > 1)
const hasNext = computed(() => props.currentPage < props.totalPages)

const visiblePages = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const half = Math.floor(props.maxVisible / 2)
  
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisible - 1)
  
  // Adjust start if we're near the end
  if (end - start + 1 < props.maxVisible) {
    start = Math.max(1, end - props.maxVisible + 1)
  }

  // Add first page and ellipsis if needed
  if (start > 1) {
    pages.push(1)
    if (start > 2) {
      pages.push('ellipsis')
    }
  }

  // Add visible pages
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  // Add ellipsis and last page if needed
  if (end < props.totalPages) {
    if (end < props.totalPages - 1) {
      pages.push('ellipsis')
    }
    pages.push(props.totalPages)
  }

  return pages
})

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}

function prev() {
  if (hasPrev.value) {
    goToPage(props.currentPage - 1)
  }
}

function next() {
  if (hasNext.value) {
    goToPage(props.currentPage + 1)
  }
}
</script>

<template>
  <nav 
    v-if="totalPages > 1" 
    class="flex items-center justify-center gap-1"
    aria-label="Pagination"
  >
    <!-- Previous button -->
    <button
      type="button"
      :disabled="!hasPrev"
      :class="[
        'flex items-center justify-center h-10 w-10 rounded-lg transition-colors',
        hasPrev 
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
      ]"
      @click="prev"
    >
      <ChevronLeft class="h-5 w-5" />
    </button>

    <!-- Page numbers -->
    <template v-for="(page, index) in visiblePages" :key="index">
      <span 
        v-if="page === 'ellipsis'" 
        class="px-2 text-gray-400 dark:text-gray-500"
      >
        ...
      </span>
      
      <button
        v-else
        type="button"
        :class="[
          'flex items-center justify-center h-10 min-w-[40px] px-3 rounded-lg font-medium transition-colors',
          page === currentPage
            ? 'bg-primary-500 text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        ]"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </template>

    <!-- Next button -->
    <button
      type="button"
      :disabled="!hasNext"
      :class="[
        'flex items-center justify-center h-10 w-10 rounded-lg transition-colors',
        hasNext 
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
      ]"
      @click="next"
    >
      <ChevronRight class="h-5 w-5" />
    </button>
  </nav>
</template>

