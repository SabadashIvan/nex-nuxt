<script setup lang="ts">
/**
 * Product card for catalog listings
 */
import { Heart, ShoppingCart, Eye } from 'lucide-vue-next'
import type { ProductListItem } from '~/types'
import { getImageUrl } from '~/utils'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'

interface Props {
  product: ProductListItem
}

const props = defineProps<Props>()

const isAddingToCart = ref(false)
const isTogglingFavorite = ref(false)

const productImage = computed(() => {
  return getImageUrl(props.product.image) || props.product.images?.[0]?.url
})

const hasDiscount = computed(() => {
  if (!props.product.price) return false
  // Parse price strings: "$587.53" -> 587.53
  const listPrice = parseFloat(props.product.price.list_minor.replace(/[^0-9.]/g, ''))
  const effectivePrice = parseFloat(props.product.price.effective_minor.replace(/[^0-9.]/g, ''))
  return !isNaN(listPrice) && !isNaN(effectivePrice) && effectivePrice < listPrice
})

// Access stores inside computed
const isFavorite = computed(() => {
  try {
    return useFavoritesStore().isFavorite(props.product.id)
  } catch {
    return false
  }
})

async function addToCart() {
  isAddingToCart.value = true
  const cartStore = useCartStore()
  await cartStore.addItem(props.product.id, 1)
  isAddingToCart.value = false
}

async function toggleFavorite() {
  isTogglingFavorite.value = true
  const favoritesStore = useFavoritesStore()
  await favoritesStore.toggleFavorite(props.product.id)
  isTogglingFavorite.value = false
}
</script>

<template>
  <div class="group bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-lg">
    <!-- Image -->
    <NuxtLink :to="`/product/${product.slug}`" class="block relative aspect-square overflow-hidden">
      <NuxtImg
        v-if="productImage"
        :src="productImage"
        :alt="product.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div 
        v-else 
        class="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
      >
        <span class="text-gray-400 dark:text-gray-500">No image</span>
      </div>

      <!-- Discount badge -->
      <div 
        v-if="hasDiscount"
        class="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded"
      >
        Sale
      </div>

      <!-- Quick actions -->
      <div class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          class="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'text-red-500': isFavorite, 'text-gray-600 dark:text-gray-400': !isFavorite }"
          :disabled="isTogglingFavorite"
          @click.prevent="toggleFavorite"
        >
          <Heart class="h-5 w-5" :class="{ 'fill-current': isFavorite }" />
        </button>
        <NuxtLink
          :to="`/product/${product.slug}`"
          class="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
        >
          <Eye class="h-5 w-5" />
        </NuxtLink>
      </div>

      <!-- Out of stock overlay -->
      <div 
        v-if="!product.is_in_stock"
        class="absolute inset-0 bg-black/50 flex items-center justify-center"
      >
        <span class="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg font-medium text-gray-900 dark:text-gray-100">
          Out of Stock
        </span>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="p-4">
      <!-- Category or rating could go here -->
      <div v-if="product.rating && product.rating.value > 0" class="mb-2">
        <UiRating :rating="product.rating.value" :reviews-count="product.rating.count" size="sm" />
      </div>

      <!-- Title -->
      <NuxtLink :to="`/product/${product.slug}`">
        <h3 class="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          {{ product.title }}
        </h3>
      </NuxtLink>

      <!-- Price -->
      <div class="mt-2">
        <UiPrice 
          :price="product.price" 
        />
      </div>

      <!-- Add to cart button -->
      <button
        v-if="product.is_in_stock"
        class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isAddingToCart"
        @click="addToCart"
      >
        <UiSpinner v-if="isAddingToCart" size="sm" />
        <ShoppingCart v-else class="h-5 w-5" />
        <span>Add to Cart</span>
      </button>
      <button
        v-else
        class="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
        disabled
      >
        Out of Stock
      </button>
    </div>
  </div>
</template>

