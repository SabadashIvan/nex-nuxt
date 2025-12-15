<script setup lang="ts">
/**
 * Product detail page - SSR for SEO
 */
import { Heart, ShoppingCart, Minus, Plus, Share2, Truck, Shield, RefreshCw } from 'lucide-vue-next'
import { useProductStore } from '~/stores/product.store'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'

const route = useRoute()

const slug = computed(() => route.params.slug as string)

// Fetch product with SSR - access store inside callback
const { data: product, pending, error } = await useAsyncData(
  `product-${slug.value}`,
  async () => {
    const productStore = useProductStore()
    return await productStore.fetch(slug.value)
  },
  { watch: [slug] }
)

// Handle 404
if (!product.value && !pending.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product Not Found',
  })
}

// Local state
const quantity = ref(1)
const selectedImageIndex = ref(0)
const isAddingToCart = ref(false)

// Computed - access stores inside computed
const currentVariant = computed(() => {
  try {
    return useProductStore().currentVariant
  } catch {
    return null
  }
})
const images = computed(() => {
  try {
    return useProductStore().images
  } catch {
    return []
  }
})
const currentImage = computed(() => images.value[selectedImageIndex.value]?.url)
const inStock = computed(() => {
  try {
    return useProductStore().inStock
  } catch {
    return false
  }
})
const hasDiscount = computed(() => {
  try {
    return useProductStore().hasDiscount
  } catch {
    return false
  }
})
const isFavorite = computed(() => {
  try {
    return useFavoritesStore().isFavorite(product.value?.id || 0)
  } catch {
    return false
  }
})
const selectedOptions = computed(() => {
  try {
    return useProductStore().selectedOptions
  } catch {
    return {}
  }
})

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Catalog', to: '/catalog' },
  { label: product.value?.name || 'Product' },
])

// Methods
async function addToCart() {
  if (!currentVariant.value || !inStock.value) return
  
  isAddingToCart.value = true
  const cartStore = useCartStore()
  await cartStore.addItem(currentVariant.value.id, quantity.value)
  isAddingToCart.value = false
}

async function toggleFavorite() {
  if (!product.value) return
  const favoritesStore = useFavoritesStore()
  await favoritesStore.toggleFavorite(product.value.id)
}

function incrementQuantity() {
  quantity.value++
}

function decrementQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function selectOption(code: string, value: string) {
  const productStore = useProductStore()
  productStore.selectOption(code, value)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading -->
    <div v-if="pending" class="animate-pulse">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="aspect-square bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div class="space-y-4">
          <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div class="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="product">
      <!-- Breadcrumbs -->
      <UiBreadcrumbs :items="breadcrumbs" class="mb-6" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <!-- Images -->
        <div>
          <!-- Main image -->
          <div class="aspect-square bg-white dark:bg-gray-900 rounded-xl overflow-hidden mb-4">
            <NuxtImg
              v-if="currentImage"
              :src="currentImage"
              :alt="product.name"
              class="w-full h-full object-contain"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="flex gap-3 overflow-x-auto pb-2">
            <button
              v-for="(image, index) in images"
              :key="image.id"
              class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
              :class="[
                index === selectedImageIndex 
                  ? 'border-primary-500' 
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              ]"
              @click="selectedImageIndex = index"
            >
              <NuxtImg
                :src="image.url"
                :alt="`${product.name} ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- Product info -->
        <div>
          <!-- Title -->
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {{ product.name }}
          </h1>

          <!-- Rating -->
          <div v-if="product.rating" class="mt-3">
            <UiRating :rating="product.rating" :reviews-count="product.reviews_count" />
          </div>

          <!-- Price -->
          <div class="mt-4">
            <UiPrice
              :price="product.price"
              :effective-price="product.effective_price"
              :currency="product.currency"
              size="xl"
            />
          </div>

          <!-- Stock status -->
          <div class="mt-4">
            <UiBadge v-if="inStock" variant="success">In Stock</UiBadge>
            <UiBadge v-else variant="error">Out of Stock</UiBadge>
          </div>

          <!-- Short description -->
          <p v-if="product.short_description" class="mt-4 text-gray-600 dark:text-gray-400">
            {{ product.short_description }}
          </p>

          <!-- Options -->
          <div v-if="product.options?.length" class="mt-6 space-y-4">
            <div v-for="option in product.options" :key="option.code">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ option.name }}
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="value in option.values"
                  :key="value.value"
                  :disabled="!value.is_available"
                  class="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  :class="[
                    selectedOptions[option.code] === value.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    !value.is_available && 'opacity-50 cursor-not-allowed line-through',
                  ]"
                  @click="selectOption(option.code, value.value)"
                >
                  {{ value.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Quantity and Add to Cart -->
          <div class="mt-6 flex flex-col sm:flex-row gap-4">
            <UiQuantitySelector v-model="quantity" :disabled="!inStock" />
            
            <button
              class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!inStock || isAddingToCart"
              @click="addToCart"
            >
              <UiSpinner v-if="isAddingToCart" size="sm" />
              <ShoppingCart v-else class="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>

          <!-- Secondary actions -->
          <div class="mt-4 flex gap-4">
            <button
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              :class="{ 'text-red-500': isFavorite }"
              @click="toggleFavorite"
            >
              <Heart class="h-5 w-5" :class="{ 'fill-current': isFavorite }" />
              <span>{{ isFavorite ? 'In Wishlist' : 'Add to Wishlist' }}</span>
            </button>
            <button class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Share2 class="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>

          <!-- Features -->
          <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex items-center gap-3">
                <Truck class="h-5 w-5 text-gray-400" />
                <span class="text-sm text-gray-600 dark:text-gray-400">Free Shipping</span>
              </div>
              <div class="flex items-center gap-3">
                <Shield class="h-5 w-5 text-gray-400" />
                <span class="text-sm text-gray-600 dark:text-gray-400">Secure Payment</span>
              </div>
              <div class="flex items-center gap-3">
                <RefreshCw class="h-5 w-5 text-gray-400" />
                <span class="text-sm text-gray-600 dark:text-gray-400">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="product.description" class="mt-12">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
        <div 
          class="prose dark:prose-invert max-w-none"
          v-html="product.description"
        />
      </div>

      <!-- Specifications -->
      <div v-if="product.specifications?.length" class="mt-12">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Specifications</h2>
        <div class="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
          <table class="w-full">
            <tbody>
              <template v-for="(spec, index) in product.specifications" :key="index">
                <tr 
                  v-for="item in spec.items" 
                  :key="item.name"
                  class="border-b border-gray-200 dark:border-gray-800 last:border-0"
                >
                  <td class="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">
                    {{ item.name }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {{ item.value }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

