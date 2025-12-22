<script setup lang="ts">
/**
 * Single-page checkout - CSR only
 * All checkout steps on one page per architecture.md
 */
import { Check, ChevronRight, Lock } from 'lucide-vue-next'
import type { Address } from '~/types'

definePageMeta({
  layout: 'checkout',
})

const router = useRouter()
const checkoutStore = useCheckoutStore()
const cartStore = useCartStore()

// Local state
const shippingAddress = ref<Address | null>(null)
const billingAddress = ref<Address | null>(null)
const billingSameAsShipping = ref(true)
const isProcessing = ref(false)
const addressErrors = ref<Record<string, string>>({})

// Computed
const hasSession = computed(() => checkoutStore.hasSession)
const items = computed(() => checkoutStore.items)
const pricing = computed(() => checkoutStore.pricing)
const shippingMethods = computed(() => checkoutStore.shippingMethods)
const selectedShipping = computed(() => checkoutStore.selectedShipping)
const paymentProviders = computed(() => checkoutStore.paymentProviders)
const selectedPayment = computed(() => checkoutStore.selectedPayment)
const canConfirm = computed(() => checkoutStore.canConfirm)
const error = computed(() => checkoutStore.error)

// Steps
const steps = [
  { id: 'address', label: 'Address', icon: '1' },
  { id: 'shipping', label: 'Shipping', icon: '2' },
  { id: 'payment', label: 'Payment', icon: '3' },
  { id: 'confirm', label: 'Review', icon: '4' },
]

const currentStepIndex = computed(() => {
  const status = checkoutStore.status
  const statusMap: Record<string, number> = {
    idle: 0,
    address: 0,
    shipping: 1,
    payment: 2,
    confirm: 3,
  }
  return statusMap[status] ?? 0
})

// Initialize checkout on mount
onMounted(async () => {
  // Load cart first
  await cartStore.loadCart()
  
  // Check if cart is empty
  if (cartStore.isEmpty) {
    router.push('/cart')
    return
  }

  // Start checkout session
  await checkoutStore.startCheckout()
  
  // Pre-fill address if available
  if (checkoutStore.addresses.shipping) {
    shippingAddress.value = checkoutStore.addresses.shipping
  }
})

// Methods
async function submitAddress() {
  if (!shippingAddress.value) return
  
  // Basic validation
  const required = ['first_name', 'last_name', 'phone', 'country', 'region', 'city', 'postal', 'address_line_1']
  addressErrors.value = {}
  
  for (const field of required) {
    if (!shippingAddress.value[field as keyof Address]) {
      addressErrors.value[field] = 'This field is required'
    }
  }
  
  if (Object.keys(addressErrors.value).length > 0) return

  isProcessing.value = true
  await checkoutStore.updateAddress(
    shippingAddress.value,
    billingSameAsShipping.value ? undefined : billingAddress.value || undefined,
    billingSameAsShipping.value
  )
  isProcessing.value = false
}

async function selectShippingMethod(methodId: number) {
  isProcessing.value = true
  await checkoutStore.applyShippingMethod(methodId)
  isProcessing.value = false
}

async function selectPaymentProvider(code: string) {
  isProcessing.value = true
  await checkoutStore.applyPaymentProvider(code)
  isProcessing.value = false
}

async function confirmOrder() {
  isProcessing.value = true
  const orderId = await checkoutStore.confirmCheckout()
  isProcessing.value = false
  
  if (orderId) {
    router.push(`/profile/order/${orderId}`)
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Loading -->
    <div v-if="!hasSession" class="flex items-center justify-center py-24">
      <UiSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Progress steps -->
      <nav class="mb-8">
        <ol class="flex items-center justify-center">
          <li 
            v-for="(step, index) in steps" 
            :key="step.id"
            class="flex items-center"
          >
            <div 
              class="flex items-center gap-2"
              :class="[
                index <= currentStepIndex 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400 dark:text-gray-500'
              ]"
            >
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                :class="[
                  index < currentStepIndex 
                    ? 'bg-primary-500 text-white' 
                    : index === currentStepIndex
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                ]"
              >
                <Check v-if="index < currentStepIndex" class="h-5 w-5" />
                <span v-else>{{ step.icon }}</span>
              </div>
              <span class="hidden sm:inline text-sm font-medium">{{ step.label }}</span>
            </div>
            <ChevronRight 
              v-if="index < steps.length - 1" 
              class="mx-4 h-5 w-5 text-gray-300 dark:text-gray-600" 
            />
          </li>
        </ol>
      </nav>

      <!-- Error message -->
      <div 
        v-if="error" 
        class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <p class="text-red-700 dark:text-red-400">{{ error }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Address section -->
          <section class="bg-white dark:bg-gray-900 rounded-lg p-6">
            <CheckoutAddressForm
              v-model="shippingAddress"
              title="Shipping Address"
              :errors="addressErrors"
            />

            <!-- Billing same as shipping -->
            <div class="mt-6">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="billingSameAsShipping"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                >
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Billing address same as shipping
                </span>
              </label>
            </div>

            <!-- Billing address (if different) -->
            <div v-if="!billingSameAsShipping" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <CheckoutAddressForm
                v-model="billingAddress"
                title="Billing Address"
              />
            </div>

            <!-- Submit address button -->
            <button
              v-if="currentStepIndex === 0"
              class="mt-6 w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              :disabled="isProcessing"
              @click="submitAddress"
            >
              <UiSpinner v-if="isProcessing" size="sm" class="mr-2" />
              Continue to Shipping
            </button>
          </section>

          <!-- Shipping methods section -->
          <section 
            v-if="currentStepIndex >= 1"
            class="bg-white dark:bg-gray-900 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Shipping Method
            </h3>

            <div v-if="shippingMethods.length" class="space-y-3">
              <CheckoutShippingMethodCard
                v-for="method in shippingMethods"
                :key="method.id"
                :method="method"
                :selected="selectedShipping?.id === method.id"
                @select="selectShippingMethod(method.id)"
              />
            </div>
            <p v-else class="text-gray-500 dark:text-gray-400">
              Loading shipping methods...
            </p>
          </section>

          <!-- Payment providers section -->
          <section 
            v-if="currentStepIndex >= 2"
            class="bg-white dark:bg-gray-900 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Payment Method
            </h3>

            <div v-if="paymentProviders.length" class="space-y-3">
              <CheckoutPaymentProviderCard
                v-for="provider in paymentProviders"
                :key="provider.code"
                :provider="provider"
                :selected="selectedPayment?.code === provider.code"
                @select="selectPaymentProvider(provider.code)"
              />
            </div>
            <p v-else class="text-gray-500 dark:text-gray-400">
              Loading payment methods...
            </p>
          </section>

          <!-- Confirm section -->
          <section 
            v-if="currentStepIndex >= 3"
            class="bg-white dark:bg-gray-900 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Review Your Order
            </h3>

            <!-- Address summary -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div v-if="shippingAddress">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Shipping to</h4>
                <p class="text-sm text-gray-900 dark:text-gray-100">
                  {{ shippingAddress.first_name }} {{ shippingAddress.last_name }}<br>
                  {{ shippingAddress.address_line_1 }}<br>
                  {{ shippingAddress.city }}, {{ shippingAddress.region }} {{ shippingAddress.postal }}<br>
                  {{ shippingAddress.country }}
                </p>
              </div>
              <div v-if="selectedShipping">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Delivery</h4>
                <p class="text-sm text-gray-900 dark:text-gray-100">
                  {{ selectedShipping.name }}<br>
                  <span v-if="selectedShipping.estimated_days">
                    Est. {{ selectedShipping.estimated_days }} days
                  </span>
                </p>
              </div>
            </div>

            <!-- Place order button -->
            <button
              class="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
              :disabled="!canConfirm || isProcessing"
              @click="confirmOrder"
            >
              <UiSpinner v-if="isProcessing" size="sm" />
              <Lock v-else class="h-5 w-5" />
              <span>Place Order</span>
            </button>

            <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </section>
        </div>

        <!-- Order summary sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <CheckoutOrderSummary
              :items="items"
              :pricing="pricing"
              :shipping="selectedShipping"
              :payment="selectedPayment"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

