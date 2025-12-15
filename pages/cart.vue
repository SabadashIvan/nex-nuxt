<script setup lang="ts">
/**
 * Cart page - CSR only (token dependent)
 */
import { ShoppingBag, ArrowLeft } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart.store'

// Load cart on mount (CSR only) - access store inside onMounted
onMounted(async () => {
  const cartStore = useCartStore()
  await cartStore.loadCart()
})

// Access stores inside computed properties
const cart = computed(() => {
  try {
    return useCartStore().cart
  } catch {
    return null
  }
})
const items = computed(() => {
  try {
    return useCartStore().items
  } catch {
    return []
  }
})
const totals = computed(() => {
  try {
    return useCartStore().totals
  } catch {
    return null
  }
})
const isEmpty = computed(() => {
  try {
    return useCartStore().isEmpty
  } catch {
    return true
  }
})
const loading = computed(() => {
  try {
    return useCartStore().loading
  } catch {
    return false
  }
})
const appliedCoupons = computed(() => {
  try {
    return useCartStore().appliedCoupons
  } catch {
    return []
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs :items="[{ label: 'Shopping Cart' }]" class="mb-6" />

    <!-- Header -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Shopping Cart</h1>

    <!-- Loading -->
    <div v-if="loading && !cart" class="animate-pulse space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty cart -->
    <UiEmptyState
      v-else-if="isEmpty"
      title="Your cart is empty"
      description="Looks like you haven't added any items to your cart yet."
      :icon="ShoppingBag"
    >
      <template #action>
        <NuxtLink
          to="/catalog"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
        >
          Continue Shopping
        </NuxtLink>
      </template>
    </UiEmptyState>

    <!-- Cart content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Items -->
      <div class="lg:col-span-2 space-y-4">
        <CartItem v-for="item in items" :key="item.id" :item="item" />

        <!-- Continue shopping -->
        <NuxtLink 
          to="/catalog" 
          class="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mt-4"
        >
          <ArrowLeft class="h-4 w-4" />
          Continue Shopping
        </NuxtLink>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <CartSummary 
          v-if="totals" 
          :totals="totals" 
          :coupons="appliedCoupons"
        />
      </div>
    </div>
  </div>
</template>

