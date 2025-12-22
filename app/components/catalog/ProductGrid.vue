<script setup lang="ts">
/**
 * Product grid for catalog listings
 */
import type { ProductListItem } from '~/types'

interface Props {
  products: ProductListItem[]
  loading?: boolean
  cols?: 2 | 3 | 4
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  cols: 4,
})

const gridCols = computed(() => {
  const colsMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }
  return colsMap[props.cols]
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" :class="['grid gap-6', gridCols]">
      <div 
        v-for="i in 8" 
        :key="i" 
        class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse"
      >
        <div class="aspect-square bg-gray-200 dark:bg-gray-800" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>

    <!-- Products -->
    <div v-else-if="products.length > 0" :class="['grid gap-6', gridCols]">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      title="No products found"
      description="Try adjusting your filters or search criteria"
    />
  </div>
</template>

