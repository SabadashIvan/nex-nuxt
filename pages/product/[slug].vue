<script setup lang="ts">
/**
 * Product detail page - SSR for SEO
 */
import { Heart, ShoppingCart, Minus, Plus, Share2, Truck, Shield, RefreshCw } from 'lucide-vue-next'
import { useProductStore } from '~/stores/product.store'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'
import type { ProductVariant, ApiResponse } from '~/types'
import type { ProductPrice } from '~/types/catalog'

const route = useRoute()

const slug = computed(() => route.params.slug as string)

// Fetch product with SSR + client-side navigation support
// Using useAsyncData with proper watch to ensure data loads on navigation
// routeRules with swr: 3600 handles SSR caching at the route level
const { data: product, pending, error, refresh } = await useAsyncData(
  () => `product-${slug.value}`,
  async () => {
    const currentSlug = slug.value
    console.log('[Fetch] Starting fetch for slug:', currentSlug, 'isServer:', import.meta.server)
    
    const api = useApi()
    
    try {
      const response = await api.get<ApiResponse<ProductVariant> | ProductVariant>(`/catalog/variants/${currentSlug}`)
      
      console.log('[SSR/CSR] Raw API response type:', typeof response)
      console.log('[SSR/CSR] Raw API response:', JSON.stringify(response, null, 2))
      console.log('[SSR/CSR] Has data property:', 'data' in response)
      
      // Handle wrapped response - API might return { data: ProductVariant } or ProductVariant directly
      let productData: ProductVariant | null = null
      
      if (response && typeof response === 'object') {
        // Check if response is wrapped in { data: ... }
        if ('data' in response && response.data) {
          productData = response.data as ProductVariant
          console.log('[SSR/CSR] Extracted from data wrapper')
        } 
        // Check if response has ProductVariant properties directly
        else if ('id' in response || 'title' in response || 'slug' in response) {
          // Direct response - it's already a ProductVariant
          productData = response as ProductVariant
          console.log('[SSR/CSR] Using direct response')
        }
      }
      
      if (!productData) {
        console.error('[SSR/CSR] Failed to extract product data from response:', response)
        return null
      }
      
      // Double-check: if productData still has 'data' property, extract it
      if (productData && typeof productData === 'object' && 'data' in productData && productData.data) {
        console.warn('[SSR/CSR] ProductData still wrapped, extracting again')
        productData = productData.data as ProductVariant
      }
      
      console.log('[SSR/CSR] Final product data:', {
        id: productData.id,
        title: productData.title,
        hasPrice: !!productData.price,
        priceType: typeof productData.price,
        hasImages: productData.images?.length > 0,
      })
      
      // Ensure productData is a plain object for proper serialization
      // Create a clean copy to avoid any reactivity issues
      const cleanProductData: ProductVariant = {
        ...productData,
        // Ensure all nested objects are properly copied
        price: productData.price,
        images: productData.images ? [...productData.images] : [],
        attribute_values: productData.attribute_values ? [...productData.attribute_values] : [],
        product: productData.product ? { ...productData.product } : undefined,
        variant_options: productData.variant_options ? { ...productData.variant_options } : undefined,
      }
      
      console.log('[SSR/CSR] Clean product data:', {
        id: cleanProductData.id,
        title: cleanProductData.title,
      })
      
      // Also populate store for option selection functionality
      const productStore = useProductStore()
      productStore.product = cleanProductData
      productStore.selectedVariant = null
      productStore.selectedOptions = {}
      
      // Initialize selected options
      if (cleanProductData.attribute_values && cleanProductData.attribute_values.length > 0) {
        cleanProductData.attribute_values.forEach(attr => {
          productStore.selectedOptions[attr.attribute.code] = attr.code
        })
      }
      
      return cleanProductData
    } catch (err) {
      console.error('[SSR/CSR] Error fetching product:', err)
      return null
    }
  },
  { 
    watch: [() => route.params.slug],
    server: true,
    // SWR-like behavior: show cached data immediately, then refresh in background
    // On client: try store cache first (from previous navigation)
    getCachedData: (key) => {
      if (import.meta.client) {
        try {
          const productStore = useProductStore()
          const currentSlug = slug.value
          // If store has product with matching slug, return cached data
          if (productStore.product && productStore.product.slug === currentSlug) {
            console.log('[Cache] Returning cached product from store:', productStore.product.slug)
            return productStore.product
          }
        } catch (err) {
          console.log('[Cache] Store not available on client:', err)
        }
      }
      // For SSR: routeRules with swr handles caching
      // Nuxt's built-in cache will be checked automatically
      return undefined
    },
    default: () => null,
  }
)

// Watch for route changes to ensure we refetch on client-side navigation
// This is a backup to ensure data loads even if watch in useAsyncData doesn't trigger
watch(() => route.params.slug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug && import.meta.client) {
    console.log('[Route] Slug changed on client, refreshing data:', { oldSlug, newSlug })
    await refresh()
  }
}, { immediate: false })

// Debug logging (only on client, after mount to avoid hydration issues)
onMounted(() => {
  isMounted.value = true
  if (import.meta.client) {
    console.log('[Client] Product value on mount:', product.value)
    console.log('[Client] Product value type:', typeof product.value)
    console.log('[Client] Product value keys:', product.value ? Object.keys(product.value) : 'null')
    
    // Check if product.value is wrapped in { data: ... }
    if (product.value && typeof product.value === 'object' && 'data' in product.value) {
      console.warn('[Client] Product value is wrapped in data object! Unwrapping...')
      // This shouldn't happen, but if it does, we need to handle it
    }
    
    watch(() => product.value, (newProduct) => {
      console.log('[Client] Product value changed:', newProduct)
      if (newProduct) {
        // Check if it's wrapped in { data: ... }
        let actualProduct: ProductVariant | null = null
        if (typeof newProduct === 'object' && newProduct !== null) {
          if ('data' in newProduct && newProduct.data) {
            console.warn('[Client] Product value is wrapped in data object! Unwrapping...')
            actualProduct = newProduct.data as ProductVariant
          } else if ('id' in newProduct || 'title' in newProduct) {
            actualProduct = newProduct as ProductVariant
          }
        }
        if (actualProduct) {
          console.log('[Client] Product loaded:', {
            id: actualProduct.id,
            title: actualProduct.title,
            hasPrice: !!actualProduct.price,
          })
        } else {
          console.warn('[Client] Could not extract product from:', newProduct)
        }
      } else {
        console.warn('[Client] Product is null or undefined')
      }
    }, { immediate: true })
    
    // Log product state for debugging
    watchEffect(() => {
      console.log('[Client WatchEffect] Product state:', {
        hasProduct: !!product.value,
        productId: product.value?.id,
        productTitle: product.value?.title,
        pending: pending.value,
        error: error.value,
      })
    })
  }
})

// Handle 404 - but only after we're sure data is loaded
// Use watch to handle 404 after data loads (both SSR and CSR)
watch([product, pending, error], ([prod, isPending, err]) => {
  if (!isPending && !prod && !err) {
    console.warn('[SSR/CSR] Product not found, throwing 404')
    throw createError({
      statusCode: 404,
      statusMessage: 'Product Not Found',
    })
  }
}, { immediate: true })

// Local state
const quantity = ref(1)
const selectedImageIndex = ref(0)
const isAddingToCart = ref(false)
const isMounted = ref(false)

// Computed - use product.value directly (from useAsyncData)
const currentVariant = computed(() => product.value)
const images = computed(() => product.value?.images || [])
const currentImage = computed(() => images.value[selectedImageIndex.value]?.url)
const inStock = computed(() => {
  if (!product.value) return false
  return product.value.is_in_stock ?? product.value.in_stock ?? false
})
const hasDiscount = computed(() => {
  if (!product.value) return false
  if (typeof product.value.price === 'object' && product.value.price !== null) {
    const list = parseFloat(product.value.price.list_minor.replace(/[^0-9.]/g, '')) || 0
    const effective = parseFloat(product.value.price.effective_minor.replace(/[^0-9.]/g, '')) || 0
    return effective < list
  }
  return (product.value.effective_price || 0) < (typeof product.value.price === 'number' ? product.value.price : 0)
})
const isFavorite = computed(() => {
  // During SSR, only use product data to ensure hydration consistency
  if (product.value?.is_favorite !== undefined) {
    return product.value.is_favorite
  }
  // On client, check favorites store
  if (import.meta.client) {
    try {
      return useFavoritesStore().isFavorite(product.value?.id || 0)
    } catch {
      return false
    }
  }
  return false
})
// Helper to compute selected options from product data (for SSR/initial render consistency)
const computeSelectedOptionsFromProduct = (): Record<string, string> => {
  const options: Record<string, string> = {}
  if (product.value?.attribute_values && product.value.attribute_values.length > 0) {
    product.value.attribute_values.forEach(attr => {
      options[attr.attribute.code] = attr.code
    })
  }
  return options
}

const selectedOptions = computed(() => {
  // Always compute from product data during SSR and initial client render (before mount)
  // This ensures hydration consistency
  if (import.meta.server || !isMounted.value) {
    return computeSelectedOptionsFromProduct()
  }
  // After mount, use store (which may have been modified by user interactions)
  try {
    const storeOptions = useProductStore().selectedOptions
    // Merge with product data to ensure we have all options
    const productOptions = computeSelectedOptionsFromProduct()
    return { ...productOptions, ...storeOptions }
  } catch {
    return computeSelectedOptionsFromProduct()
  }
})
// Helper to compute available options from product data (for SSR/initial render consistency)
const computeAvailableOptionsFromProduct = () => {
  if (!product.value) return []
  
  // New structure: variant_options
  if (product.value.variant_options) {
    const currentAttributeValues = product.value.attribute_values || []
    
    return product.value.variant_options.axes.map(axis => {
      return {
        code: axis.code,
        name: axis.title,
        values: (product.value!.variant_options?.options[axis.code] || []).map(opt => {
          const matchingAttr = currentAttributeValues.find(av => 
            av.attribute.code === axis.code && 
            av.label.toLowerCase() === opt.label.toLowerCase()
          )
          
          return {
            value: matchingAttr?.code || opt.label,
            label: opt.label,
            is_available: opt.is_in_stock,
            slug: opt.slug,
            value_id: opt.value_id,
          }
        }),
      }
    })
  }
  
  // Legacy structure: options
  return product.value.options || []
}

const availableOptions = computed(() => {
  // Always compute from product data during SSR and initial client render (before mount)
  // This ensures hydration consistency
  if (import.meta.server || !isMounted.value) {
    return computeAvailableOptionsFromProduct()
  }
  // After mount, use store (which may have computed values)
  try {
    return useProductStore().availableOptions
  } catch {
    return computeAvailableOptionsFromProduct()
  }
})
const productTitle = computed(() => {
  return product.value?.title || product.value?.name || 'Product'
})
const productRating = computed(() => {
  if (product.value?.rating && typeof product.value.rating === 'object') {
    return product.value.rating.value || 0
  }
  // Legacy support: rating as number
  return typeof product.value?.rating === 'number' ? product.value.rating : 0
})
const reviewsCount = computed(() => {
  if (product.value?.rating && typeof product.value.rating === 'object') {
    return product.value.rating.count || 0
  }
  // Legacy support
  return (product.value as any)?.reviews_count || 0
})
const productPrice = computed((): ProductPrice | null => {
  if (!product.value) return null
  // Check if price is an object (ProductPrice type) with required properties
  const price = product.value.price
  if (price && typeof price === 'object' && price !== null && 'currency' in price && 'effective_minor' in price) {
    return price as ProductPrice
  }
  return null
})
const legacyPriceValue = computed((): number | null => {
  if (!product.value) return null
  // Return numeric price if available, otherwise effective_price
  if (typeof product.value.price === 'number' && product.value.price > 0) {
    return product.value.price
  }
  if (typeof product.value.effective_price === 'number' && product.value.effective_price > 0) {
    return product.value.effective_price
  }
  return null
})
const priceToDisplay = computed((): ProductPrice | number | null => {
  // Return ProductPrice object if available
  if (productPrice.value !== null) {
    return productPrice.value
  }
  // Return numeric price if available
  if (legacyPriceValue.value !== null) {
    return legacyPriceValue.value
  }
  return null
})
const productBrand = computed(() => {
  return product.value?.product?.brand
})
const productCategories = computed(() => {
  return product.value?.product?.categories || []
})

// Breadcrumbs - ensure stable structure for SSR hydration
// Always return at least Catalog + Product to ensure consistent DOM structure
const breadcrumbs = computed(() => {
  const items: Array<{ label: string; to?: string }> = [
    { label: 'Catalog', to: '/catalog' },
  ]
  
  // Add category breadcrumbs if available
  if (product.value?.product?.categories && product.value.product.categories.length > 0) {
    const mainCategory = product.value.product.categories[0]
    if (mainCategory?.slug) {
      items.push({ 
        label: mainCategory.title || mainCategory.name || 'Category', 
        to: `/catalog/${mainCategory.slug}` 
      })
    }
  }
  
  // Add brand if available
  if (product.value?.product?.brand?.slug) {
    items.push({ 
      label: product.value.product.brand.title || 'Brand', 
      to: `/catalog?brand=${product.value.product.brand.slug}` 
    })
  }
  
  // Last item - always add product title (or placeholder)
  items.push({ 
    label: product.value?.title || product.value?.name || 'Product', 
    to: '#' 
  })
  
  return items
})

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

// Helper to get option value safely
function getOptionValue(optionValue: any): string {
  if ('value' in optionValue && optionValue.value) {
    return optionValue.value
  }
  if ('value_id' in optionValue && optionValue.value_id) {
    return optionValue.value_id.toString()
  }
  return optionValue.label || ''
}

// Helper to check if option is available
function isOptionAvailable(optionValue: any): boolean {
  if ('is_available' in optionValue) {
    return optionValue.is_available ?? true
  }
  if ('is_in_stock' in optionValue) {
    return optionValue.is_in_stock ?? true
  }
  return true
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Error -->
    <div v-if="error" class="text-center py-12">
      <p class="text-red-600 dark:text-red-400">Error loading product: {{ error }}</p>
    </div>

    <!-- Breadcrumbs - always render to ensure consistent DOM structure (outside conditional blocks) -->
    <UiBreadcrumbs :items="breadcrumbs" class="mb-6" />

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
    <div v-else-if="product">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <!-- Images -->
        <div>
          <!-- Main image -->
          <div class="aspect-square bg-white dark:bg-gray-900 rounded-xl overflow-hidden mb-4">
            <NuxtImg
              v-if="currentImage"
              :src="currentImage"
              :alt="productTitle"
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
                :alt="`${productTitle} ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- Product info -->
        <div>
          <!-- Brand -->
          <div v-if="productBrand" class="mb-2">
            <NuxtLink
              :to="`/catalog?brand=${productBrand.slug}`"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ productBrand.title }}
            </NuxtLink>
          </div>

          <!-- Title -->
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {{ productTitle }}
          </h1>

          <!-- SKU -->
          <div v-if="product.sku" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            SKU: {{ product.sku }}
          </div>

          <!-- Rating -->
          <div v-if="productRating > 0 || reviewsCount > 0" class="mt-3">
            <UiRating :rating="productRating" :reviews-count="reviewsCount" />
          </div>

          <!-- Price -->
          <div v-if="product && priceToDisplay !== null" class="mt-4">
            <template v-if="productPrice !== null">
              <UiPrice
                :price="productPrice"
                size="xl"
              />
            </template>
            <template v-else-if="legacyPriceValue !== null && typeof legacyPriceValue === 'number'">
              <UiPrice
                :price="legacyPriceValue"
                :effective-price="product.effective_price"
                :currency="product.currency"
                size="xl"
              />
            </template>
          </div>

          <!-- Stock status -->
          <div class="mt-4">
            <UiBadge v-if="inStock" variant="success">In Stock</UiBadge>
            <UiBadge v-else variant="error">Out of Stock</UiBadge>
          </div>

          <!-- Categories -->
          <div v-if="productCategories.length > 0" class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              v-for="category in productCategories"
              :key="category.id"
              :to="`/catalog/${category.slug}`"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ category.title || category.name }}
            </NuxtLink>
          </div>

          <!-- Short description -->
          <p v-if="product.short_description || product.product?.description" class="mt-4 text-gray-600 dark:text-gray-400">
            {{ product.short_description || product.product?.description }}
          </p>

          <!-- Options -->
          <div v-if="availableOptions.length" class="mt-6 space-y-4">
            <div v-for="option in availableOptions" :key="option.code">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ option.name }}
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="value in option.values"
                  :key="getOptionValue(value)"
                  :disabled="!isOptionAvailable(value)"
                  class="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  :class="[
                    selectedOptions[option.code] === getOptionValue(value)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    !isOptionAvailable(value) && 'opacity-50 cursor-not-allowed line-through',
                  ]"
                  @click="selectOption(option.code, getOptionValue(value))"
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
      <div v-if="product.description || product.product?.description" class="mt-12">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
        <div 
          class="prose dark:prose-invert max-w-none"
          v-html="product.description || product.product?.description"
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
    </div>
  </div>
</template>

