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
const priceMin = ref<number | undefined>(props.activeFilters.price_min)
const priceMax = ref<number | undefined>(props.activeFilters.price_max)
const selectedAttributes = ref<Record<string, string[]>>(props.activeFilters.attributes || {})

// Watch for external changes
watch(() => props.activeFilters, (newFilters) => {
  priceMin.value = newFilters.price_min
  priceMax.value = newFilters.price_max
  selectedAttributes.value = newFilters.attributes || {}
}, { deep: true })

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
  const filters: ProductFilter = {}
  
  if (priceMin.value !== undefined) {
    filters.price_min = priceMin.value
  }
  if (priceMax.value !== undefined) {
    filters.price_max = priceMax.value
  }
  
  // Only include non-empty attribute arrays
  const cleanedAttributes: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(selectedAttributes.value)) {
    if (values.length > 0) {
      cleanedAttributes[key] = values
    }
  }
  if (Object.keys(cleanedAttributes).length > 0) {
    filters.attributes = cleanedAttributes
  }
  
  emit('update:filters', filters)
}

function resetFilters() {
  priceMin.value = undefined
  priceMax.value = undefined
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

            <!-- Attribute filters -->
            <div v-for="group in filters.attributes" :key="group.code">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {{ group.name }}
              </h3>
              <div class="space-y-2">
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
                    <span v-if="option.count" class="text-gray-400">({{ option.count }})</span>
                  </span>
                </label>
              </div>
            </div>
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

      <!-- Attribute filters -->
      <div 
        v-for="group in filters.attributes" 
        :key="group.code"
        class="bg-white dark:bg-gray-900 rounded-lg p-4"
      >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {{ group.name }}
        </h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
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
              <span v-if="option.count" class="text-gray-400">({{ option.count }})</span>
            </span>
          </label>
        </div>
      </div>

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

