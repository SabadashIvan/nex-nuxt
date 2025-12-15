<script setup lang="ts">
/**
 * Favorites/Wishlist page - CSR only
 */
import { Heart, ShoppingCart, Trash2 } from 'lucide-vue-next'
import { useFavoritesStore } from '~/stores/favorites.store'
import { useCartStore } from '~/stores/cart.store'

// Load favorites on mount - access store inside onMounted
onMounted(async () => {
  const favoritesStore = useFavoritesStore()
  await favoritesStore.fetchFavorites()
})

// Access stores inside computed
const favorites = computed(() => {
  try {
    return useFavoritesStore().favorites
  } catch {
    return []
  }
})
const isEmpty = computed(() => {
  try {
    return useFavoritesStore().isEmpty
  } catch {
    return true
  }
})
const loading = computed(() => {
  try {
    return useFavoritesStore().loading
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

async function removeFromFavorites(variantId: number) {
  const favoritesStore = useFavoritesStore()
  await favoritesStore.removeFromFavorites(variantId)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs :items="[{ label: 'Wishlist' }]" class="mb-6" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">My Wishlist</h1>
      <span v-if="!isEmpty" class="text-gray-500 dark:text-gray-400">
        {{ favorites.length }} items
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading && favorites.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-900 rounded-xl animate-pulse">
        <div class="aspect-square bg-gray-200 dark:bg-gray-800" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="isEmpty"
      title="Your wishlist is empty"
      description="Save items you love by clicking the heart icon on products."
      :icon="Heart"
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

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div 
        v-for="item in favorites" 
        :key="item.id"
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden group"
      >
        <!-- Image -->
        <NuxtLink :to="`/product/${item.slug}`" class="block relative aspect-square">
          <NuxtImg
            v-if="item.images?.[0]?.url"
            :src="item.images[0].url"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <span class="text-gray-400">No image</span>
          </div>

          <!-- Remove button -->
          <button
            class="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            @click.prevent="removeFromFavorites(item.id)"
          >
            <Trash2 class="h-5 w-5" />
          </button>
        </NuxtLink>

        <!-- Content -->
        <div class="p-4">
          <NuxtLink :to="`/product/${item.slug}`">
            <h3 class="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {{ item.name }}
            </h3>
          </NuxtLink>

          <div class="mt-2">
            <UiPrice 
              :price="item.price" 
              :effective-price="item.effective_price"
              :currency="item.currency"
            />
          </div>

          <!-- Add to cart -->
          <button
            v-if="item.in_stock"
            class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            :disabled="addingToCart === item.id"
            @click="addToCart(item.id)"
          >
            <UiSpinner v-if="addingToCart === item.id" size="sm" />
            <ShoppingCart v-else class="h-5 w-5" />
            <span>Add to Cart</span>
          </button>
          <button
            v-else
            class="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Out of Stock
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

