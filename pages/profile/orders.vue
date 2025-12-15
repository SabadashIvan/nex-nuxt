<script setup lang="ts">
/**
 * Order history page
 */
import { Package, Eye } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'
import { getImageUrl } from '~/utils'

definePageMeta({
  layout: 'profile',
})

const ordersStore = shallowRef<ReturnType<typeof useOrdersStore> | null>(null)

const defaultPagination = {
  page: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
}

onMounted(async () => {
  const store = useOrdersStore()
  ordersStore.value = store
  await store.fetchOrders()
})

const orders = computed(() => ordersStore.value?.orders ?? [])
const pagination = computed(() => ordersStore.value?.pagination ?? defaultPagination)
const loading = computed(() => ordersStore.value?.loading ?? false)

async function handlePageChange(page: number) {
  const store = ordersStore.value
  if (!store) return

  await store.goToPage(page)
}

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
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Orders</h1>

    <!-- Loading -->
    <div v-if="loading && orders.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>

    <!-- Orders list -->
    <div v-else-if="orders.length" class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white dark:bg-gray-900 rounded-lg p-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100">
              Order #{{ order.order_number }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Placed on {{ formatDate(order.created_at) }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <UiBadge :variant="getStatusVariant(order.status)">
              {{ order.status }}
            </UiBadge>
            <NuxtLink
              :to="`/profile/order/${order.id}`"
              class="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
            >
              <Eye class="h-4 w-4" />
              View Details
            </NuxtLink>
          </div>
        </div>

        <!-- Order items preview -->
        <div class="flex items-center gap-3 overflow-x-auto pb-2">
          <div
            v-for="item in order.items.slice(0, 4)"
            :key="item.id"
            class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <NuxtImg
              v-if="getImageUrl(item.image)"
              :src="getImageUrl(item.image)"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-if="order.items.length > 4" class="text-sm text-gray-500 dark:text-gray-400">
            +{{ order.items.length - 4 }} more
          </div>
        </div>

        <!-- Total -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ order.items.length }} items
          </span>
          <div class="font-semibold">
            <UiPrice :price="order.totals.total" :currency="order.totals.currency" :show-discount="false" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.lastPage > 1" class="mt-6">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.lastPage"
          @update:current-page="handlePageChange"
        />
      </div>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      title="No orders yet"
      description="When you place an order, it will appear here"
      :icon="Package"
    >
      <template #action>
        <NuxtLink
          to="/catalog"
          class="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Start Shopping
        </NuxtLink>
      </template>
    </UiEmptyState>
  </div>
</template>

