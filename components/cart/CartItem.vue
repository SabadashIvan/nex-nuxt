<script setup lang="ts">
/**
 * Cart item component
 */
import { Trash2 } from 'lucide-vue-next'
import type { CartItem } from '~/types'
import { useCartStore } from '~/stores/cart.store'
import { getImageUrl } from '~/utils'

interface Props {
  item: CartItem
}

const props = defineProps<Props>()

const isUpdating = ref(false)
const isRemoving = ref(false)

const quantity = ref(props.item.quantity)

const imageUrl = computed(() => getImageUrl(props.item.image))

// Watch for external changes
watch(() => props.item.quantity, (newVal) => {
  quantity.value = newVal
})

async function updateQuantity(newQuantity: number) {
  if (newQuantity === props.item.quantity || newQuantity < 1) return
  
  isUpdating.value = true
  const cartStore = useCartStore()
  await cartStore.updateItemQuantity(props.item.id, newQuantity)
  isUpdating.value = false
}

async function removeItem() {
  isRemoving.value = true
  const cartStore = useCartStore()
  await cartStore.removeItem(props.item.id)
  isRemoving.value = false
}

// Debounced update
const { debounced: debouncedUpdate } = useDebounce((qty: number) => updateQuantity(qty), 500)

watch(quantity, (newVal) => {
  if (newVal !== props.item.quantity && newVal >= 1) {
    debouncedUpdate(newVal)
  }
})
</script>

<template>
  <div 
    class="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg"
    :class="{ 'opacity-50': isRemoving }"
  >
    <!-- Image -->
    <NuxtLink :to="`/product/${item.slug}`" class="flex-shrink-0">
      <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        <NuxtImg
          v-if="imageUrl"
          :src="imageUrl"
          :alt="item.name"
          class="w-full h-full object-cover"
        />
      </div>
    </NuxtLink>

    <!-- Details -->
    <div class="flex-1 min-w-0">
      <NuxtLink :to="`/product/${item.slug}`">
        <h3 class="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate">
          {{ item.name }}
        </h3>
      </NuxtLink>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">SKU: {{ item.sku }}</p>

      <!-- Options -->
      <div v-if="item.options" class="mt-2 flex flex-wrap gap-2">
        <span 
          v-for="(value, key) in item.options" 
          :key="key"
          class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
        >
          {{ key }}: {{ value }}
        </span>
      </div>

      <!-- Price for mobile -->
      <div class="mt-2 sm:hidden">
        <UiPrice 
          :price="item.price" 
          :effective-price="item.effective_price"
          :currency="item.currency"
          size="sm"
        />
      </div>
    </div>

    <!-- Price for desktop -->
    <div class="hidden sm:block text-right">
      <UiPrice 
        :price="item.price" 
        :effective-price="item.effective_price"
        :currency="item.currency"
      />
    </div>

    <!-- Quantity -->
    <div class="flex-shrink-0">
      <UiQuantitySelector
        v-model="quantity"
        :max="item.max_quantity || 99"
        :disabled="isUpdating || isRemoving"
        size="sm"
      />
    </div>

    <!-- Line total -->
    <div class="hidden sm:block w-24 text-right">
      <UiPrice 
        :price="item.total" 
        :currency="item.currency"
        :show-discount="false"
      />
    </div>

    <!-- Remove button -->
    <button
      class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
      :disabled="isRemoving"
      @click="removeItem"
    >
      <Trash2 class="h-5 w-5" />
    </button>
  </div>
</template>

