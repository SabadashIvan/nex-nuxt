<script setup lang="ts">
/**
 * Filters sidebar for catalog
 */
import { X, SlidersHorizontal } from 'lucide-vue-next'
import type { CatalogFilters, ProductFilter } from '~/types'

interface Props {
  filters: CatalogFilters
  activeFilters: ProductFilter
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: ProductFilter]
  'reset': []
}>()

const isOpen = ref(false)

// Local filter state
const priceMin = ref<number | undefined>(
  props.activeFilters.filters?.price_min !== undefined 
    ? Number(props.activeFilters.filters.price_min) 
    : undefined
)
const priceMax = ref<number | undefined>(
  props.activeFilters.filters?.price_max !== undefined 
    ? Number(props.activeFilters.filters.price_max) 
    : undefined
)
// Categories and brands stored as string[] (comma-separated IDs)
const selectedCategories = ref<string[]>([])
const selectedBrands = ref<string[]>([])
// Attributes stored as Record<code, string[]> for UI
const selectedAttributes = ref<Record<string, string[]>>({})

// Initialize filters from activeFilters
function initializeFilters() {
  // Initialize categories
  if (props.activeFilters.filters?.categories) {
    selectedCategories.value = props.activeFilters.filters.categories.split(',')
  } else {
    selectedCategories.value = []
  }
  
  // Initialize brands
  if (props.activeFilters.filters?.brands) {
    selectedBrands.value = props.activeFilters.filters.brands.split(',')
  } else {
    selectedBrands.value = []
  }
  
  // Initialize attributes
  selectedAttributes.value = {}
  if (props.activeFilters.filters?.attributes && props.filters.attributes) {
    // Map attributes by code - each attribute group in filters.attributes corresponds to a code
    props.activeFilters.filters.attributes.forEach((attrGroup, index) => {
      const attrGroupDef = props.filters.attributes?.[index]
      if (attrGroupDef) {
        // Split comma-separated values
        selectedAttributes.value[attrGroupDef.code] = attrGroup.split(',')
      }
    })
  }
}

// Initialize on mount
initializeFilters()

// Watch for external changes
watch(() => props.activeFilters, (newFilters) => {
  priceMin.value = newFilters.filters?.price_min !== undefined 
    ? Number(newFilters.filters.price_min) 
    : undefined
  priceMax.value = newFilters.filters?.price_max !== undefined 
    ? Number(newFilters.filters.price_max) 
    : undefined
  initializeFilters()
}, { deep: true })

function toggleCategory(categoryId: string) {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value.push(categoryId)
  } else {
    selectedCategories.value.splice(index, 1)
  }
  applyFilters()
}

function isCategorySelected(categoryId: string): boolean {
  return selectedCategories.value.includes(categoryId)
}

function toggleBrand(brandId: string) {
  const index = selectedBrands.value.indexOf(brandId)
  if (index === -1) {
    selectedBrands.value.push(brandId)
  } else {
    selectedBrands.value.splice(index, 1)
  }
  applyFilters()
}

function isBrandSelected(brandId: string): boolean {
  return selectedBrands.value.includes(brandId)
}

function toggleAttribute(code: string, value: string) {
  if (!selectedAttributes.value[code]) {
    selectedAttributes.value[code] = []
  }
  
  const index = selectedAttributes.value[code].indexOf(value)
  if (index === -1) {
    selectedAttributes.value[code].push(value)
  } else {
    selectedAttributes.value[code].splice(index, 1)
  }
  
  applyFilters()
}

function isAttributeSelected(code: string, value: string): boolean {
  return selectedAttributes.value[code]?.includes(value) || false
}

function applyFilters() {
  const filterData: Record<string, string | number | string[]> = {}
  let hasFilters = false
  
  // Categories
  if (selectedCategories.value.length > 0) {
    filterData.categories = selectedCategories.value.join(',')
    hasFilters = true
  }
  
  // Brands
  if (selectedBrands.value.length > 0) {
    filterData.brands = selectedBrands.value.join(',')
    hasFilters = true
  }
  
  // Price range
  if (priceMin.value !== undefined) {
    filterData.price_min = priceMin.value
    hasFilters = true
  }
  if (priceMax.value !== undefined) {
    filterData.price_max = priceMax.value
    hasFilters = true
  }
  
  // Convert attributes from Record<string, string[]> to string[] format
  // Order must match the order in props.filters.attributes
  const attributeArray: string[] = []
  if (props.filters.attributes) {
    props.filters.attributes.forEach((attrGroup) => {
      const selectedValues = selectedAttributes.value[attrGroup.code]
      if (selectedValues && selectedValues.length > 0) {
        // Join values with comma: "4,5" or "7,8"
        attributeArray.push(selectedValues.join(','))
      }
    })
  }
  if (attributeArray.length > 0) {
    filterData.attributes = attributeArray
    hasFilters = true
  }
  
  // Only emit if there are actual filters
  const filters: ProductFilter = hasFilters ? { filters: filterData } : {}
  emit('update:filters', filters)
}

function resetFilters() {
  priceMin.value = undefined
  priceMax.value = undefined
  selectedCategories.value = []
  selectedBrands.value = []
  selectedAttributes.value = {}
  emit('reset')
}

const { debounced: debouncedApplyFilters } = useDebounce(applyFilters, 500)
</script>

<template>
  <div>
    <!-- Mobile filter button -->
    <button
      class="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm font-medium"
      @click="isOpen = true"
    >
      <SlidersHorizontal class="h-5 w-5" />
      Filters
    </button>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 lg:hidden"
      >
        <div class="absolute inset-0 bg-black/50" @click="isOpen = false" />
        <div class="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl p-6 overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
            <button @click="isOpen = false">
              <X class="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          <!-- Filter content (same as desktop) -->
          <div class="space-y-6">
            <!-- Price range -->
            <div v-if="filters.price_range">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Price Range</h3>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="priceMin"
                  type="number"
                  :min="filters.price_range.min"
                  :max="filters.price_range.max"
                  placeholder="Min"
                  class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                  @input="debouncedApplyFilters"
                >
                <span class="text-gray-400">-</span>
                <input
                  v-model.number="priceMax"
                  type="number"
                  :min="filters.price_range.min"
                  :max="filters.price_range.max"
                  placeholder="Max"
                  class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                  @input="debouncedApplyFilters"
                >
              </div>
            </div>

            <!-- Categories -->
            <div v-if="filters.categories && filters.categories.length > 0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Categories</h3>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <label 
                  v-for="category in filters.categories" 
                  :key="category.value"
                  class="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="isCategorySelected(category.value)"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    @change="toggleCategory(category.value)"
                  >
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ category.label }}
                    <span v-if="category.count" class="text-gray-400">({{ category.count }})</span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Brands -->
            <div v-if="filters.brands && filters.brands.length > 0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Brands</h3>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <label 
                  v-for="brand in filters.brands" 
                  :key="brand.value"
                  class="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="isBrandSelected(brand.value)"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    @change="toggleBrand(brand.value)"
                  >
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ brand.label }}
                    <span v-if="brand.count" class="text-gray-400">({{ brand.count }})</span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Attribute filters -->
            <template v-if="filters.attributes && filters.attributes.length > 0">
              <div v-for="group in filters.attributes" :key="group.code">
                <h3 v-if="group.name" class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {{ group.name }}
                </h3>
                <div v-if="group.options && group.options.length > 0" class="space-y-2">
                  <label 
                    v-for="option in group.options" 
                    :key="option.value"
                    class="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :checked="isAttributeSelected(group.code, option.value)"
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      @change="toggleAttribute(group.code, option.value)"
                    >
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ option.label }}
                      <span v-if="option.count !== undefined" class="text-gray-400">({{ option.count }})</span>
                    </span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <!-- Actions -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
              @click="resetFilters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop sidebar -->
    <div class="hidden lg:block space-y-6">
      <!-- Price range -->
      <div v-if="filters.price_range" class="bg-white dark:bg-gray-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Price Range</h3>
        <div class="flex items-center gap-3">
          <input
            v-model.number="priceMin"
            type="number"
            :min="filters.price_range.min"
            :max="filters.price_range.max"
            placeholder="Min"
            class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
            @input="debouncedApplyFilters"
          >
          <span class="text-gray-400">-</span>
          <input
            v-model.number="priceMax"
            type="number"
            :min="filters.price_range.min"
            :max="filters.price_range.max"
            placeholder="Max"
            class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
            @input="debouncedApplyFilters"
          >
        </div>
      </div>

      <!-- Categories -->
      <div v-if="filters.categories && filters.categories.length > 0" class="bg-white dark:bg-gray-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Categories</h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <label 
            v-for="category in filters.categories" 
            :key="category.value"
            class="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="isCategorySelected(category.value)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              @change="toggleCategory(category.value)"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ category.label }}
              <span v-if="category.count" class="text-gray-400">({{ category.count }})</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Brands -->
      <div v-if="filters.brands && filters.brands.length > 0" class="bg-white dark:bg-gray-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Brands</h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <label 
            v-for="brand in filters.brands" 
            :key="brand.value"
            class="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="isBrandSelected(brand.value)"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              @change="toggleBrand(brand.value)"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ brand.label }}
              <span v-if="brand.count" class="text-gray-400">({{ brand.count }})</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Attribute filters -->
      <template v-if="filters.attributes && filters.attributes.length > 0">
        <div 
          v-for="group in filters.attributes" 
          :key="group.code"
          class="bg-white dark:bg-gray-900 rounded-lg p-4"
        >
          <h3 v-if="group.name" class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {{ group.name }}
          </h3>
          <div v-if="group.options && group.options.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
            <label 
              v-for="option in group.options" 
              :key="option.value"
              class="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="isAttributeSelected(group.code, option.value)"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                @change="toggleAttribute(group.code, option.value)"
              >
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ option.label }}
                <span v-if="option.count !== undefined" class="text-gray-400">({{ option.count }})</span>
              </span>
            </label>
          </div>
        </div>
      </template>

      <!-- Reset button -->
      <button
        class="w-full px-4 py-2 bg-white dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        @click="resetFilters"
      >
        Reset Filters
      </button>
    </div>
  </div>
</template>

