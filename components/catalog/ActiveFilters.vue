<script setup lang="ts">
/**
 * Active filters display component
 * Shows selected filters as chips with remove buttons
 */
import { X } from 'lucide-vue-next'
import type { ProductFilter, CatalogFilters } from '~/types'

interface Props {
  activeFilters: ProductFilter
  availableFilters: CatalogFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'remove-filter': [type: string, value: string]
  'reset': []
}>()

// Build list of active filters for display
const activeFilterChips = computed(() => {
  const chips: Array<{ type: string; label: string; value: string; displayValue: string }> = []
  
  // Categories
  if (props.activeFilters.filters?.categories) {
    const categoryIds = props.activeFilters.filters.categories.split(',')
    categoryIds.forEach((id) => {
      const category = props.availableFilters.categories?.find(c => c.value === id)
      if (category) {
        chips.push({
          type: 'categories',
          label: 'Category',
          value: id,
          displayValue: category.label,
        })
      }
    })
  }
  
  // Brands
  if (props.activeFilters.filters?.brands) {
    const brandIds = props.activeFilters.filters.brands.split(',')
    brandIds.forEach((id) => {
      const brand = props.availableFilters.brands?.find(b => b.value === id)
      if (brand) {
        chips.push({
          type: 'brands',
          label: 'Brand',
          value: id,
          displayValue: brand.label,
        })
      }
    })
  }
  
  // Price range
  if (props.activeFilters.filters?.price_min !== undefined || props.activeFilters.filters?.price_max !== undefined) {
    const min = props.activeFilters.filters.price_min
    const max = props.activeFilters.filters.price_max
    let priceLabel = 'Price'
    if (min !== undefined && max !== undefined) {
      priceLabel = `Price: ${min} - ${max}`
    } else if (min !== undefined) {
      priceLabel = `Price: from ${min}`
    } else if (max !== undefined) {
      priceLabel = `Price: up to ${max}`
    }
    chips.push({
      type: 'price',
      label: 'Price',
      value: 'price',
      displayValue: priceLabel,
    })
  }
  
  // Attributes
  if (props.activeFilters.filters?.attributes && props.availableFilters.attributes) {
    props.activeFilters.filters.attributes.forEach((attrGroup, index) => {
      const attrDef = props.availableFilters.attributes?.[index]
      if (attrDef) {
        const valueIds = attrGroup.split(',')
        valueIds.forEach((valueId) => {
          const option = attrDef.options?.find(o => o.value === valueId)
          if (option) {
            chips.push({
              type: 'attributes',
              label: attrDef.name,
              value: `${attrDef.code}:${valueId}`,
              displayValue: `${attrDef.name}: ${option.label}`,
            })
          }
        })
      }
    })
  }
  
  return chips
})

function removeFilter(type: string, value: string) {
  emit('remove-filter', type, value)
}

function resetAll() {
  emit('reset')
}
</script>

<template>
  <div v-if="activeFilterChips.length > 0" class="bg-white dark:bg-gray-900 rounded-lg px-4 py-3 mb-6 border border-gray-200 dark:border-gray-800">
    <div class="flex items-center flex-wrap gap-3">
      <span class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
        Вы выбрали:
      </span>
      
      <div class="flex items-center flex-wrap gap-2">
        <button
          v-for="chip in activeFilterChips"
          :key="chip.value"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="removeFilter(chip.type, chip.value)"
        >
          <span>{{ chip.displayValue }}</span>
          <X class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
        </button>
      </div>
      
      <button
        class="ml-auto text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium"
        @click="resetAll"
      >
        Сбросить все
      </button>
    </div>
  </div>
</template>

