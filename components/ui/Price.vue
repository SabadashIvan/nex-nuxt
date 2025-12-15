<script setup lang="ts">
/**
 * Price display component with discount support
 */
import { formatPrice, hasDiscount, formatDiscountPercent } from '~/utils/price'
import { useSystemStore } from '~/stores/system.store'

interface Props {
  price: number
  effectivePrice?: number
  currency?: string
  showDiscount?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  effectivePrice: undefined,
  currency: 'USD',
  showDiscount: true,
  size: 'md',
})

// Access store inside computed
const displayCurrency = computed(() => {
  try {
    return props.currency || useSystemStore().currentCurrency
  } catch {
    return props.currency || 'USD'
  }
})

const currentPrice = computed(() => props.effectivePrice ?? props.price)

const isDiscounted = computed(() => 
  props.effectivePrice !== undefined && hasDiscount(props.price, props.effectivePrice)
)

const discountPercent = computed(() => 
  isDiscounted.value ? formatDiscountPercent(props.price, props.effectivePrice!) : ''
)

const formattedPrice = computed(() => 
  formatPrice(currentPrice.value, { currency: displayCurrency.value })
)

const formattedOriginalPrice = computed(() => 
  formatPrice(props.price, { currency: displayCurrency.value })
)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl font-bold',
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="inline-flex items-center gap-2 flex-wrap">
    <!-- Current price -->
    <span 
      :class="[
        sizeClasses,
        isDiscounted ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-100'
      ]"
    >
      {{ formattedPrice }}
    </span>

    <!-- Original price (if discounted) -->
    <span 
      v-if="isDiscounted" 
      class="text-gray-400 line-through text-sm"
    >
      {{ formattedOriginalPrice }}
    </span>

    <!-- Discount badge -->
    <span 
      v-if="isDiscounted && showDiscount && discountPercent"
      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    >
      {{ discountPercent }}
    </span>
  </div>
</template>

