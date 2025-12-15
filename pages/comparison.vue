<script setup lang="ts">
/**
 * Product comparison page - CSR only
 */
import { GitCompare, Trash2, ShoppingCart, X } from 'lucide-vue-next'
import { useComparisonStore } from '~/stores/comparison.store'
import { useCartStore } from '~/stores/cart.store'

// Load comparison on mount - access store inside onMounted
onMounted(async () => {
  const comparisonStore = useComparisonStore()
  await comparisonStore.fetchComparison()
})

// Access stores inside computed
const items = computed(() => {
  try {
    return useComparisonStore().items
  } catch {
    return []
  }
})
const isEmpty = computed(() => {
  try {
    return useComparisonStore().isEmpty
  } catch {
    return true
  }
})
const loading = computed(() => {
  try {
    return useComparisonStore().loading
  } catch {
    return false
  }
})

const addingToCart = ref<number | null>(null)

async function addToCart(variantId: number) {
  addingToCart.value = variantId
  const cartStore = useCartStore()
  await cartStore.addItem(variantId, 1)
  addingToCart.value = null
}

async function removeItem(variantId: number) {
  const comparisonStore = useComparisonStore()
  await comparisonStore.removeFromComparison(variantId)
}

async function clearAll() {
  const comparisonStore = useComparisonStore()
  await comparisonStore.clearComparison()
}

// Get all unique attribute names
const attributeNames = computed(() => {
  const names = new Set<string>()
  items.value.forEach(item => {
    item.attributes?.forEach(attr => {
      names.add(attr.name)
    })
  })
  return Array.from(names)
})

// Get attribute value for an item
function getAttributeValue(item: typeof items.value[0], attrName: string): string {
  const attr = item.attributes?.find(a => a.name === attrName)
  return attr?.value || '-'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs :items="[{ label: 'Compare Products' }]" class="mb-6" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Compare Products</h1>
      <button
        v-if="!isEmpty"
        class="text-sm text-red-500 hover:underline"
        @click="clearAll"
      >
        Clear All
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && items.length === 0" class="animate-pulse">
      <div class="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="isEmpty"
      title="No products to compare"
      description="Add products to compare their features side by side."
      :icon="GitCompare"
    >
      <template #action>
        <NuxtLink
          to="/catalog"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
        >
          Browse Products
        </NuxtLink>
      </template>
    </UiEmptyState>

    <!-- Comparison table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[800px]">
        <!-- Product cards row -->
        <thead>
          <tr>
            <th class="w-48 p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 align-top">
              Product
            </th>
            <th 
              v-for="item in items" 
              :key="item.id"
              class="p-4 text-left align-top"
            >
              <div class="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <!-- Remove button -->
                <button
                  class="absolute top-2 right-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors z-10"
                  @click="removeItem(item.id)"
                >
                  <X class="h-4 w-4" />
                </button>

                <!-- Image -->
                <NuxtLink :to="`/product/${item.slug}`" class="block aspect-square">
                  <NuxtImg
                    v-if="item.images?.[0]?.url"
                    :src="item.images[0].url"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                  />
                </NuxtLink>

                <!-- Info -->
                <div class="p-3">
                  <NuxtLink :to="`/product/${item.slug}`">
                    <h3 class="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 hover:text-primary-600 transition-colors">
                      {{ item.name }}
                    </h3>
                  </NuxtLink>
                  <div class="mt-2">
                    <UiPrice 
                      :price="item.price" 
                      :effective-price="item.effective_price"
                      :currency="item.currency"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <!-- Stock status -->
          <tr>
            <td class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Availability</td>
            <td v-for="item in items" :key="item.id" class="p-4">
              <UiBadge :variant="item.in_stock ? 'success' : 'error'" size="sm">
                {{ item.in_stock ? 'In Stock' : 'Out of Stock' }}
              </UiBadge>
            </td>
          </tr>

          <!-- Rating -->
          <tr>
            <td class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rating</td>
            <td v-for="item in items" :key="item.id" class="p-4">
              <UiRating 
                v-if="item.rating" 
                :rating="item.rating" 
                :reviews-count="item.reviews_count"
                size="sm"
              />
              <span v-else class="text-gray-400">-</span>
            </td>
          </tr>

          <!-- Attributes -->
          <tr v-for="attrName in attributeNames" :key="attrName">
            <td class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{{ attrName }}</td>
            <td v-for="item in items" :key="item.id" class="p-4 text-sm text-gray-900 dark:text-gray-100">
              {{ getAttributeValue(item, attrName) }}
            </td>
          </tr>

          <!-- Add to cart row -->
          <tr>
            <td class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</td>
            <td v-for="item in items" :key="item.id" class="p-4">
              <button
                v-if="item.in_stock"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                :disabled="addingToCart === item.id"
                @click="addToCart(item.id)"
              >
                <UiSpinner v-if="addingToCart === item.id" size="sm" />
                <ShoppingCart v-else class="h-4 w-4" />
                Add to Cart
              </button>
              <span v-else class="text-sm text-gray-400">Unavailable</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

