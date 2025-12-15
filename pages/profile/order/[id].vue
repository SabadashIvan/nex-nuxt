<script setup lang="ts">
/**
 * Order detail page
 */
import { ArrowLeft, Package, Truck, MapPin, CreditCard } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'

definePageMeta({
  layout: 'profile',
})

const route = useRoute()
const ordersStore = useOrdersStore()

const orderId = computed(() => parseInt(route.params.id as string))

onMounted(async () => {
  await ordersStore.fetchOrder(orderId.value)
})

const order = computed(() => ordersStore.order)
const loading = computed(() => ordersStore.loading)

function getStatusVariant(status: string) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'default',
  }
  return variants[status] || 'default'
}
</script>

<template>
  <div>
    <!-- Back link -->
    <NuxtLink 
      to="/profile/orders" 
      class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to Orders
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      <div class="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Order details -->
    <template v-else-if="order">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Order #{{ order.order_number }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            Placed on {{ formatDate(order.created_at) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UiBadge :variant="getStatusVariant(order.status)" size="lg">
            {{ order.status }}
          </UiBadge>
          <UiBadge :variant="order.payment_status === 'paid' ? 'success' : 'warning'" size="lg">
            {{ order.payment_status }}
          </UiBadge>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Order items -->
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package class="h-5 w-5" />
              Order Items
            </h2>
            <div class="space-y-4">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0"
              >
                <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                  <NuxtImg
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink :to="`/product/${item.slug}`">
                    <h3 class="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors">
                      {{ item.name }}
                    </h3>
                  </NuxtLink>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {{ item.sku }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Qty: {{ item.quantity }}
                  </p>
                </div>
                <div class="text-right">
                  <UiPrice :price="item.total" :currency="item.currency" :show-discount="false" />
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping address -->
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MapPin class="h-5 w-5" />
              Shipping Address
            </h2>
            <div class="text-gray-700 dark:text-gray-300">
              <p class="font-medium">
                {{ order.shipping_address.first_name }} {{ order.shipping_address.last_name }}
              </p>
              <p>{{ order.shipping_address.address_line_1 }}</p>
              <p v-if="order.shipping_address.address_line_2">
                {{ order.shipping_address.address_line_2 }}
              </p>
              <p>
                {{ order.shipping_address.city }}, {{ order.shipping_address.region }} {{ order.shipping_address.postal }}
              </p>
              <p>{{ order.shipping_address.country }}</p>
              <p class="mt-2 text-gray-500 dark:text-gray-400">
                {{ order.shipping_address.phone }}
              </p>
            </div>
          </div>

          <!-- Shipping & Payment -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Truck class="h-5 w-5" />
                Shipping Method
              </h2>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ order.shipping_method.name }}
              </p>
              <p v-if="order.shipping_method.estimated_days" class="text-sm text-gray-500 dark:text-gray-400">
                Est. {{ order.shipping_method.estimated_days }} days delivery
              </p>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <CreditCard class="h-5 w-5" />
                Payment Method
              </h2>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ order.payment_provider.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ order.payment_provider.type === 'online' ? 'Online payment' : 'Pay on delivery' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Order summary -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6 sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                <UiPrice :price="order.totals.subtotal" :currency="order.totals.currency" :show-discount="false" />
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Shipping</span>
                <span v-if="order.totals.shipping > 0">
                  <UiPrice :price="order.totals.shipping" :currency="order.totals.currency" :show-discount="false" />
                </span>
                <span v-else class="text-green-600 dark:text-green-400">Free</span>
              </div>
              <div v-if="order.totals.discounts > 0" class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Discounts</span>
                <span class="text-green-600 dark:text-green-400">
                  -<UiPrice :price="order.totals.discounts" :currency="order.totals.currency" :show-discount="false" />
                </span>
              </div>
              <div class="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                <span class="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                <UiPrice :price="order.totals.total" :currency="order.totals.currency" size="lg" :show-discount="false" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      title="Order not found"
      description="The order you're looking for doesn't exist"
    />
  </div>
</template>

