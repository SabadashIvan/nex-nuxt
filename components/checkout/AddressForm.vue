<script setup lang="ts">
/**
 * Address form component for checkout
 */
import type { Address } from '~/types'

interface Props {
  modelValue: Address | null
  title?: string
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Shipping Address',
  errors: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [address: Address]
}>()

const form = reactive<Address>({
  first_name: props.modelValue?.first_name || '',
  last_name: props.modelValue?.last_name || '',
  phone: props.modelValue?.phone || '',
  email: props.modelValue?.email || '',
  country: props.modelValue?.country || '',
  region: props.modelValue?.region || '',
  city: props.modelValue?.city || '',
  postal: props.modelValue?.postal || '',
  address_line_1: props.modelValue?.address_line_1 || '',
  address_line_2: props.modelValue?.address_line_2 || '',
})

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    Object.assign(form, newVal)
  }
}, { deep: true })

// Emit changes
watch(form, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

function getError(field: keyof Address): string | undefined {
  return props.errors[field]
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ title }}</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- First name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          First Name *
        </label>
        <input
          v-model="form.first_name"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('first_name') }"
        >
        <p v-if="getError('first_name')" class="mt-1 text-sm text-red-500">
          {{ getError('first_name') }}
        </p>
      </div>

      <!-- Last name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Last Name *
        </label>
        <input
          v-model="form.last_name"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('last_name') }"
        >
        <p v-if="getError('last_name')" class="mt-1 text-sm text-red-500">
          {{ getError('last_name') }}
        </p>
      </div>

      <!-- Phone -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone *
        </label>
        <input
          v-model="form.phone"
          type="tel"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('phone') }"
        >
        <p v-if="getError('phone')" class="mt-1 text-sm text-red-500">
          {{ getError('phone') }}
        </p>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          v-model="form.email"
          type="email"
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('email') }"
        >
        <p v-if="getError('email')" class="mt-1 text-sm text-red-500">
          {{ getError('email') }}
        </p>
      </div>

      <!-- Country -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Country *
        </label>
        <input
          v-model="form.country"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('country') }"
        >
        <p v-if="getError('country')" class="mt-1 text-sm text-red-500">
          {{ getError('country') }}
        </p>
      </div>

      <!-- Region -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          State/Region *
        </label>
        <input
          v-model="form.region"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('region') }"
        >
        <p v-if="getError('region')" class="mt-1 text-sm text-red-500">
          {{ getError('region') }}
        </p>
      </div>

      <!-- City -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          City *
        </label>
        <input
          v-model="form.city"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('city') }"
        >
        <p v-if="getError('city')" class="mt-1 text-sm text-red-500">
          {{ getError('city') }}
        </p>
      </div>

      <!-- Postal -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Postal Code *
        </label>
        <input
          v-model="form.postal"
          type="text"
          required
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('postal') }"
        >
        <p v-if="getError('postal')" class="mt-1 text-sm text-red-500">
          {{ getError('postal') }}
        </p>
      </div>

      <!-- Address line 1 -->
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address *
        </label>
        <input
          v-model="form.address_line_1"
          type="text"
          required
          placeholder="Street address"
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          :class="{ 'ring-2 ring-red-500': getError('address_line_1') }"
        >
        <p v-if="getError('address_line_1')" class="mt-1 text-sm text-red-500">
          {{ getError('address_line_1') }}
        </p>
      </div>

      <!-- Address line 2 -->
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Apartment, suite, etc.
        </label>
        <input
          v-model="form.address_line_2"
          type="text"
          placeholder="Optional"
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>
  </div>
</template>

