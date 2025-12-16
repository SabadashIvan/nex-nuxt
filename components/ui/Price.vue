<script setup lang="ts">
/**
 * Price display component with discount support
 */
import type { ProductPrice } from '~/types'
import { formatPrice, hasDiscount, formatDiscountPercent } from '~/utils/price'
import { useSystemStore } from '~/stores/system.store'

interface Props {
  price: ProductPrice | number
  effectivePrice?: number
  currency?: string
  showDiscount?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  effectivePrice: undefined,
  currency: undefined,
  showDiscount: true,
  size: 'md',
})

// Parse price from ProductPrice object or number
const parsePriceString = (priceStr: string): number => {
  return parseFloat(priceStr.replace(/[^0-9.]/g, ''))
}

// Access store inside computed
const displayCurrency = computed(() => {
  if (typeof props.price === 'object' && props.price.currency) {
    return props.price.currency
  }
  try {
    return props.currency || useSystemStore().currentCurrency
  } catch {
    return props.currency || 'USD'
  }
})

const listPrice = computed(() => {
  if (typeof props.price === 'object') {
    return parsePriceString(props.price.list_minor)
  }
  return props.price
})

const effectivePrice = computed(() => {
  if (typeof props.price === 'object') {
    return parsePriceString(props.price.effective_minor)
  }
  return props.effectivePrice ?? props.price
})

const isDiscounted = computed(() => {
  if (typeof props.price === 'object') {
    const list = parsePriceString(props.price.list_minor)
    const effective = parsePriceString(props.price.effective_minor)
    return effective < list
  }
  return props.effectivePrice !== undefined && hasDiscount(listPrice.value, effectivePrice.value)
})

const discountPercent = computed(() => {
  if (!isDiscounted.value) return ''
  if (typeof props.price === 'object') {
    const list = parsePriceString(props.price.list_minor)
    const effective = parsePriceString(props.price.effective_minor)
    return formatDiscountPercent(list, effective)
  }
  return formatDiscountPercent(listPrice.value, effectivePrice.value)
})

const formattedPrice = computed(() => {
  if (typeof props.price === 'object') {
    // Use the formatted string from API
    return props.price.effective_minor
  }
  return formatPrice(effectivePrice.value, { currency: displayCurrency.value })
})

const formattedOriginalPrice = computed(() => {
  if (typeof props.price === 'object') {
    // Use the formatted string from API
    return props.price.list_minor
  }
  return formatPrice(listPrice.value, { currency: displayCurrency.value })
})

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

