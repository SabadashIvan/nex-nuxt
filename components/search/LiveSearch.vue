<script setup lang="ts">
/**
 * Live search component with autocomplete suggestions
 */
import { Search, X, Loader2 } from 'lucide-vue-next'
import type { SearchSuggestResponse, ProductListItem } from '~/types'
import { getImageUrl } from '~/utils'

interface Props {
  /** Placeholder text */
  placeholder?: string
  /** Variants limit (1-10, default 5) */
  variantsLimit?: number
  /** Suggestions limit (1-10, default 5) */
  suggestionsLimit?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search products...',
  variantsLimit: 5,
  suggestionsLimit: 5,
})

const emit = defineEmits<{
  select: [query: string]
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const searchResults = ref<SearchSuggestResponse | null>(null)
const selectedIndex = ref(-1)

// Debounce search query
const debouncedQuery = useDebouncedRef(searchQuery, 300)

// Watch for debounced query changes
watch(debouncedQuery, async (newQuery) => {
  if (newQuery.trim().length >= 2) {
    await performSearch(newQuery.trim())
  } else {
    searchResults.value = null
    isOpen.value = false
  }
})

// Close dropdown when clicking outside
const searchRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
    isOpen.value = false
    selectedIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Handle keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value || !searchResults.value?.data) return

  const variants = searchResults.value.data.variants || []
  const suggestions = searchResults.value.data.suggestions || []
  const brands = searchResults.value.data.brands || []
  const categories = searchResults.value.data.categories || []
  const totalItems = variants.length + suggestions.length + brands.length + categories.length

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = selectedIndex.value < totalItems - 1 
      ? selectedIndex.value + 1 
      : 0
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = selectedIndex.value > 0 
      ? selectedIndex.value - 1 
      : totalItems - 1
  } else if (event.key === 'Enter' && selectedIndex.value >= 0) {
    event.preventDefault()
    handleSelect(selectedIndex.value)
  } else if (event.key === 'Escape') {
    isOpen.value = false
    selectedIndex.value = -1
  }
}

// Capture Nuxt context and API at component setup level
const nuxtApp = useNuxtApp()
const api = useApi()

// Perform search
async function performSearch(query: string) {
  if (!query || query.length < 2) {
    searchResults.value = null
    isOpen.value = false
    return
  }

  isLoading.value = true
  isOpen.value = true
  selectedIndex.value = -1

  try {
    const response = await nuxtApp.runWithContext(async () =>
      await api.get<SearchSuggestResponse>(
        '/catalog/suggest',
        {
          q: query,
          variants_limit: props.variantsLimit,
          suggestions_limit: props.suggestionsLimit,
        }
      )
    )

    searchResults.value = response
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = null
  } finally {
    isLoading.value = false
  }
}

// Handle selection
function handleSelect(index: number) {
  if (!searchResults.value?.data) return

  const variants = searchResults.value.data.variants || []
  const suggestions = searchResults.value.data.suggestions || []
  const brands = searchResults.value.data.brands || []
  const categories = searchResults.value.data.categories || []

  if (index < variants.length) {
    // Selected a variant
    const variant = variants[index]
    navigateTo(`/product/${variant.slug}`)
    closeSearch()
  } else if (index < variants.length + suggestions.length) {
    // Selected a suggestion
    const suggestionIndex = index - variants.length
    const suggestion = suggestions[suggestionIndex]
    if (suggestion) {
      searchQuery.value = suggestion.text
      emit('select', suggestion.text)
      closeSearch()
    }
  } else if (index < variants.length + suggestions.length + categories.length) {
    // Selected a category
    const categoryIndex = index - variants.length - suggestions.length
    const category = categories[categoryIndex]
    if (category) {
      navigateTo(category.slug ? `/catalog/${category.slug}` : '/catalog')
      closeSearch()
    }
  } else {
    // Selected a brand
    const brandIndex = index - variants.length - suggestions.length - categories.length
    const brand = brands[brandIndex]
    if (brand) {
      navigateTo(brand.slug ? `/catalog?brands=${brand.slug}` : '/catalog')
      closeSearch()
    }
  }
}

// Handle form submit
function handleSubmit() {
  if (searchQuery.value.trim()) {
    emit('select', searchQuery.value.trim())
    navigateTo({
      path: '/catalog',
      query: { search: searchQuery.value.trim() },
    })
    closeSearch()
  }
}

// Close search
function closeSearch() {
  isOpen.value = false
  selectedIndex.value = -1
  searchResults.value = null
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  closeSearch()
}

// Get product image
function getProductImage(product: ProductListItem): string | undefined {
  return getImageUrl(product.image) || product.images?.[0]?.url
}
</script>

<template>
  <div ref="searchRef" class="relative w-full">
    <form @submit.prevent="handleSubmit" class="w-full">
      <div class="relative">
        <Search 
          class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
        />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="placeholder"
          class="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
          @input="isOpen = searchQuery.length >= 2"
          @keydown="handleKeydown"
          @focus="isOpen = searchQuery.length >= 2 && searchResults !== null"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          @click="clearSearch"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </form>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen && (isLoading || searchResults)"
        class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
      >
        <!-- Loading state -->
        <div v-if="isLoading" class="p-4 flex items-center justify-center">
          <Loader2 class="h-5 w-5 animate-spin text-primary-500" />
          <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching...</span>
        </div>

        <!-- Results -->
        <div v-else-if="searchResults?.data">
          <!-- Variants -->
          <div v-if="searchResults.data.variants && searchResults.data.variants.length > 0" class="py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Products
            </div>
            <button
              v-for="(variant, index) in searchResults.data.variants"
              :key="variant.id"
              type="button"
              class="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': selectedIndex === index
              }"
              @click="handleSelect(index)"
            >
              <!-- Product image -->
              <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <NuxtImg
                  v-if="getProductImage(variant)"
                  :src="getProductImage(variant)"
                  :alt="variant.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="text-xs text-gray-400">No image</span>
                </div>
              </div>

              <!-- Product info -->
              <div class="flex-1 min-w-0 text-left">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                  {{ variant.title }}
                </div>
                <div class="mt-1">
                  <UiPrice :price="variant.price" size="sm" />
                </div>
              </div>
            </button>
          </div>

          <!-- Suggestions -->
          <div v-if="searchResults.data.suggestions && searchResults.data.suggestions.length > 0" class="py-2 border-t border-gray-200 dark:border-gray-700">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Suggestions
            </div>
            <button
              v-for="(suggestion, index) in searchResults.data.suggestions"
              :key="index"
              type="button"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': selectedIndex === (searchResults.data.variants?.length || 0) + index
              }"
              @click="handleSelect((searchResults.data.variants?.length || 0) + index)"
            >
              <Search class="inline-block h-4 w-4 mr-2 text-gray-400" />
              <span class="font-medium">{{ suggestion.text }}</span>
              <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">({{ Math.round(suggestion.score * 100) }}%)</span>
            </button>
          </div>

          <!-- Categories -->
          <div v-if="searchResults.data.categories && searchResults.data.categories.length > 0" class="py-2 border-t border-gray-200 dark:border-gray-700">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Categories
            </div>
            <button
              v-for="(category, index) in searchResults.data.categories"
              :key="category.id"
              type="button"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': selectedIndex === (searchResults.data.variants?.length || 0) + (searchResults.data.suggestions?.length || 0) + index
              }"
              @click="handleSelect((searchResults.data.variants?.length || 0) + (searchResults.data.suggestions?.length || 0) + index)"
            >
              {{ category.title }} <span class="text-gray-400 dark:text-gray-500">({{ category.count }})</span>
            </button>
          </div>

          <!-- Brands -->
          <div v-if="searchResults.data.brands && searchResults.data.brands.length > 0" class="py-2 border-t border-gray-200 dark:border-gray-700">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Brands
            </div>
            <button
              v-for="(brand, index) in searchResults.data.brands"
              :key="brand.id"
              type="button"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': selectedIndex === (searchResults.data.variants?.length || 0) + (searchResults.data.suggestions?.length || 0) + (searchResults.data.categories?.length || 0) + index
              }"
              @click="handleSelect((searchResults.data.variants?.length || 0) + (searchResults.data.suggestions?.length || 0) + (searchResults.data.categories?.length || 0) + index)"
            >
              {{ brand.title }} <span class="text-gray-400 dark:text-gray-500">({{ brand.count }})</span>
            </button>
          </div>

          <!-- No results -->
          <div v-if="!searchResults.data.variants?.length && !searchResults.data.suggestions?.length && !searchResults.data.categories?.length && !searchResults.data.brands?.length" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No results found
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
