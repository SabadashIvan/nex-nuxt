<script setup lang="ts">
/**
 * Shipping method selection card
 */
import { Truck, Check } from 'lucide-vue-next'
import type { ShippingMethod } from '~/types'
import { formatPrice } from '~/utils/price'

interface Props {
  method: ShippingMethod
  selected: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="w-full p-4 rounded-lg border-2 text-left transition-colors"
    :class="[
      selected
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    ]"
    @click="emit('select')"
  >
    <div class="flex items-start gap-4">
      <!-- Icon -->
      <div 
        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        :class="[
          selected 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
        ]"
      >
        <Truck class="h-5 w-5" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ method.name }}</h4>
          <span class="font-semibold text-gray-900 dark:text-gray-100">
            {{ method.price > 0 ? formatPrice(method.price, { currency: method.currency }) : 'Free' }}
          </span>
        </div>
        <p v-if="method.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ method.description }}
        </p>
        <p v-if="method.estimated_days" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estimated delivery: {{ method.estimated_days }} days
        </p>
      </div>

      <!-- Check mark -->
      <div 
        v-if="selected"
        class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"
      >
        <Check class="h-4 w-4 text-white" />
      </div>
    </div>
  </button>
</template>

