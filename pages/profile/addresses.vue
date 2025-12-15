<script setup lang="ts">
/**
 * Address management page (placeholder)
 */
import { MapPin, Plus } from 'lucide-vue-next'

definePageMeta({
  layout: 'profile',
})

// This would typically load from an identity store
const addresses = ref([])
const loading = ref(false)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">My Addresses</h1>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
      >
        <Plus class="h-5 w-5" />
        Add Address
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>

    <!-- Addresses -->
    <div v-else-if="addresses.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Address cards would go here -->
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      title="No addresses saved"
      description="Add an address for faster checkout"
      :icon="MapPin"
    >
      <template #action>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus class="h-5 w-5" />
          Add Address
        </button>
      </template>
    </UiEmptyState>
  </div>
</template>

