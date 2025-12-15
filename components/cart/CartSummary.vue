<script setup lang="ts">
/**
 * Cart summary component
 */
import { Tag } from 'lucide-vue-next'
import type { CartTotals, AppliedCoupon } from '~/types'
import { useCartStore } from '~/stores/cart.store'

interface Props {
  totals: CartTotals
  coupons?: AppliedCoupon[]
  showCheckout?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  coupons: () => [],
  showCheckout: true,
})

const couponCode = ref('')
const isApplyingCoupon = ref(false)
const couponError = ref('')

async function applyCoupon() {
  if (!couponCode.value.trim()) return
  
  isApplyingCoupon.value = true
  couponError.value = ''
  const cartStore = useCartStore()
  
  const success = await cartStore.applyCoupon(couponCode.value.trim())
  
  if (success) {
    couponCode.value = ''
  } else {
    couponError.value = cartStore.error || 'Invalid coupon code'
  }
  
  isApplyingCoupon.value = false
}

async function removeCoupon(code: string) {
  const cartStore = useCartStore()
  await cartStore.removeCoupon(code)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h2>

    <!-- Coupon input -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Promo Code
      </label>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Tag class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            v-model="couponCode"
            type="text"
            placeholder="Enter code"
            class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            @keyup.enter="applyCoupon"
          >
        </div>
        <button
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          :disabled="isApplyingCoupon || !couponCode.trim()"
          @click="applyCoupon"
        >
          Apply
        </button>
      </div>
      <p v-if="couponError" class="mt-1 text-sm text-red-500">{{ couponError }}</p>
    </div>

    <!-- Applied coupons -->
    <div v-if="coupons.length" class="mb-4 space-y-2">
      <div 
        v-for="coupon in coupons" 
        :key="coupon.code"
        class="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <Tag class="h-4 w-4 text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">{{ coupon.code }}</span>
        </div>
        <button
          class="text-sm text-green-600 dark:text-green-400 hover:underline"
          @click="removeCoupon(coupon.code)"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- Totals -->
    <div class="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
        <UiPrice :price="totals.subtotal" :currency="totals.currency" :show-discount="false" />
      </div>
      
      <div v-if="totals.shipping > 0" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Shipping</span>
        <UiPrice :price="totals.shipping" :currency="totals.currency" :show-discount="false" />
      </div>
      
      <div v-if="totals.discounts > 0" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Discounts</span>
        <span class="text-green-600 dark:text-green-400">
          -<UiPrice :price="totals.discounts" :currency="totals.currency" :show-discount="false" />
        </span>
      </div>
      
      <div class="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
        <span class="font-semibold text-gray-900 dark:text-gray-100">Total</span>
        <UiPrice :price="totals.total" :currency="totals.currency" size="lg" :show-discount="false" />
      </div>
    </div>

    <!-- Checkout button -->
    <NuxtLink
      v-if="showCheckout"
      to="/checkout"
      class="mt-6 w-full flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
    >
      Proceed to Checkout
    </NuxtLink>
  </div>
</template>

