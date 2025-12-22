/**
 * Checkout Store
 * Handles complete checkout flow: address, shipping, payment, confirmation
 * CSR-only - depends on cart token
 */

import { defineStore } from 'pinia'
import type {
  CheckoutState,
  CheckoutItem,
  CheckoutAddresses,
  CheckoutPricing,
  ShippingMethod,
  PaymentProvider,
  CheckoutStatus,
  Address,
  UpdateAddressPayload,
  SetShippingMethodPayload,
  SetPaymentProviderPayload,
  CheckoutConfirmResponse,
} from '~/types'
import { parseApiError, getErrorMessage, CHECKOUT_ERRORS } from '~/utils/errors'

const initialAddresses: CheckoutAddresses = {
  shipping: null,
  billing: null,
  billingSameAsShipping: true,
}

const initialPricing: CheckoutPricing = {
  items: 0,
  shipping: 0,
  discounts: 0,
  total: 0,
  currency: 'USD',
}

export const useCheckoutStore = defineStore('checkout', {
  state: (): CheckoutState => ({
    checkoutId: null,
    items: [],
    addresses: { ...initialAddresses },
    shippingMethods: [],
    selectedShipping: null,
    paymentProviders: [],
    selectedPayment: null,
    pricing: { ...initialPricing },
    status: 'idle',
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Check if checkout session exists
     */
    hasSession: (state): boolean => {
      return !!state.checkoutId
    },

    /**
     * Check if address is complete
     */
    hasAddress: (state): boolean => {
      return !!state.addresses.shipping
    },

    /**
     * Check if shipping method is selected
     */
    hasShipping: (state): boolean => {
      return !!state.selectedShipping
    },

    /**
     * Check if payment provider is selected
     */
    hasPayment: (state): boolean => {
      return !!state.selectedPayment
    },

    /**
     * Check if checkout can be confirmed
     */
    canConfirm: (state): boolean => {
      return !!(
        state.checkoutId &&
        state.addresses.shipping &&
        state.selectedShipping &&
        state.selectedPayment
      )
    },

    /**
     * Get total item count
     */
    itemCount: (state): number => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    /**
     * Get billing address (or shipping if same)
     */
    billingAddress: (state): Address | null => {
      if (state.addresses.billingSameAsShipping) {
        return state.addresses.shipping
      }
      return state.addresses.billing
    },
  },

  actions: {
    /**
     * Start checkout session
     */
    async startCheckout(): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.post<{
          id: string
          items: CheckoutItem[]
          pricing: CheckoutPricing
          addresses: CheckoutAddresses
        }>('/checkout/start', undefined, { cart: true })

        this.checkoutId = response.id
        this.items = response.items
        this.pricing = response.pricing
        if (response.addresses) {
          this.addresses = response.addresses
        }
        this.status = 'address'

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Start checkout error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update addresses
     */
    async updateAddress(
      shippingAddress: Address,
      billingAddress?: Address,
      billingSameAsShipping = true
    ): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: UpdateAddressPayload = {
          shipping_address: shippingAddress,
          billing_same_as_shipping: billingSameAsShipping,
        }

        if (!billingSameAsShipping && billingAddress) {
          payload.billing_address = billingAddress
        }

        const response = await api.put<{
          addresses: CheckoutAddresses
          pricing: CheckoutPricing
        }>(`/checkout/${this.checkoutId}/address`, payload, { cart: true })

        this.addresses = response.addresses
        if (response.pricing) {
          this.pricing = response.pricing
        }
        this.status = 'shipping'

        // Auto-fetch shipping methods
        await this.fetchShippingMethods()

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Update address error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch available shipping methods
     */
    async fetchShippingMethods(): Promise<void> {
      if (!this.addresses.shipping) return

      const api = useApi()
      this.loading = true

      try {
        const address = this.addresses.shipping
        const methods = await api.get<ShippingMethod[]>('/shipping/methods', {
          country: address.country,
          region: address.region,
          city: address.city,
          postal: address.postal,
        })

        this.shippingMethods = methods
      } catch (error) {
        console.error('Fetch shipping methods error:', error)
        this.shippingMethods = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Select shipping method
     */
    async applyShippingMethod(methodId: number): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: SetShippingMethodPayload = { method_id: methodId }
        const response = await api.put<{
          shipping_method: ShippingMethod
          pricing: CheckoutPricing
        }>(`/checkout/${this.checkoutId}/shipping-method`, payload, { cart: true })

        this.selectedShipping = response.shipping_method
        this.pricing = response.pricing
        this.status = 'payment'

        // Auto-fetch payment providers
        await this.fetchPaymentProviders()

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message

        // Handle specific checkout errors
        if (apiError.message.includes(CHECKOUT_ERRORS.INVALID_SHIPPING)) {
          await this.fetchShippingMethods()
        }

        console.error('Apply shipping method error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch available payment providers
     */
    async fetchPaymentProviders(): Promise<void> {
      const api = useApi()
      this.loading = true

      try {
        const providers = await api.get<PaymentProvider[]>('/payments/providers')
        this.paymentProviders = providers
      } catch (error) {
        console.error('Fetch payment providers error:', error)
        this.paymentProviders = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Select payment provider
     */
    async applyPaymentProvider(providerCode: string): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: SetPaymentProviderPayload = { provider_code: providerCode }
        const response = await api.put<{
          payment_provider: PaymentProvider
          pricing: CheckoutPricing
        }>(`/checkout/${this.checkoutId}/payment-provider`, payload, { cart: true })

        this.selectedPayment = response.payment_provider
        if (response.pricing) {
          this.pricing = response.pricing
        }
        this.status = 'confirm'

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Apply payment provider error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Confirm checkout and create order
     */
    async confirmCheckout(): Promise<number | null> {
      if (!this.checkoutId || !this.canConfirm) {
        this.error = 'Cannot confirm checkout - missing required data'
        return null
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.post<CheckoutConfirmResponse>(
          `/checkout/${this.checkoutId}/confirm`,
          undefined,
          { cart: true }
        )

        this.status = 'completed'

        // Clear cart after successful checkout
        const cartStore = useCartStore()
        cartStore.clearCart()

        return response.order_id
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message

        // Handle specific checkout errors
        if (apiError.message.includes(CHECKOUT_ERRORS.CART_CHANGED)) {
          // Cart changed during checkout - need to restart
          await this.reset()
        }

        console.error('Confirm checkout error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset checkout state
     */
    reset(): void {
      this.checkoutId = null
      this.items = []
      this.addresses = { ...initialAddresses }
      this.shippingMethods = []
      this.selectedShipping = null
      this.paymentProviders = []
      this.selectedPayment = null
      this.pricing = { ...initialPricing }
      this.status = 'idle'
      this.loading = false
      this.error = null
    },
  },
})

