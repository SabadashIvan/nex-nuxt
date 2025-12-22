<script setup lang="ts">
/**
 * Order summary for checkout
 */
import type { CheckoutItem, CheckoutPricing, ShippingMethod, PaymentProvider } from '~/types'
import { getImageUrl } from '~/utils'

interface Props {
  items: CheckoutItem[]
  pricing: CheckoutPricing
  shipping?: ShippingMethod | null
  payment?: PaymentProvider | null
}

const props = defineProps<Props>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>

    <!-- Items -->
    <div class="space-y-4 max-h-64 overflow-y-auto">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex gap-3"
        >
          <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <NuxtImg
              v-if="getImageUrl(item.image)"
              :src="getImageUrl(item.image)"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
          </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
            {{ item.name }}
          </h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Qty: {{ item.quantity }}
          </p>
          <UiPrice 
            :price="item.total" 
            :currency="item.currency"
            size="sm"
            :show-discount="false"
          />
        </div>
      </div>
    </div>

    <!-- Shipping info -->
    <div v-if="shipping" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Shipping</span>
        <span class="text-gray-900 dark:text-gray-100">{{ shipping.name }}</span>
      </div>
    </div>

    <!-- Payment info -->
    <div v-if="payment" class="mt-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Payment</span>
        <span class="text-gray-900 dark:text-gray-100">{{ payment.name }}</span>
      </div>
    </div>

    <!-- Totals -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
        <UiPrice :price="pricing.items" :currency="pricing.currency" :show-discount="false" />
      </div>
      
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Shipping</span>
        <span v-if="pricing.shipping > 0">
          <UiPrice :price="pricing.shipping" :currency="pricing.currency" :show-discount="false" />
        </span>
        <span v-else class="text-green-600 dark:text-green-400">Free</span>
      </div>
      
      <div v-if="pricing.discounts > 0" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Discounts</span>
        <span class="text-green-600 dark:text-green-400">
          -<UiPrice :price="pricing.discounts" :currency="pricing.currency" :show-discount="false" />
        </span>
      </div>
      
      <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
        <span class="font-semibold text-gray-900 dark:text-gray-100">Total</span>
        <UiPrice :price="pricing.total" :currency="pricing.currency" size="lg" :show-discount="false" />
      </div>
    </div>
  </div>
</template>

