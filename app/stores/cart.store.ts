/**
 * Cart Store
 * Handles shopping cart: items, totals, coupons, item options
 * CSR-only - depends on X-Cart-Token
 */

import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import type { 
  Cart, 
  CartItem, 
  CartTotals, 
  CartState,
  AddToCartPayload,
  UpdateCartItemPayload,
  CartItemOptionsPayload,
  CouponPayload,
  AppliedCoupon,
} from '~/types'
import { parseApiError, getErrorMessage, CHECKOUT_ERRORS } from '~/utils/errors'
import { ensureCartToken, getToken, TOKEN_KEYS, setToken } from '~/utils/tokens'

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    cartToken: null,
    loading: false,
    error: null,
    appliedCoupons: [],
  }),

  getters: {
    /**
     * Total number of items in cart
     */
    itemCount: (state): number => {
      if (!state.cart) return 0
      return state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    /**
     * Cart subtotal
     */
    subtotal: (state): number => {
      return state.cart?.totals.subtotal || 0
    },

    /**
     * Cart total
     */
    total: (state): number => {
      return state.cart?.totals.total || 0
    },

    /**
     * Total discount amount
     */
    discountTotal: (state): number => {
      return state.cart?.totals.discounts || 0
    },

    /**
     * Check if cart is empty
     */
    isEmpty: (state): boolean => {
      return !state.cart || state.cart.items.length === 0
    },

    /**
     * Get cart items
     */
    items: (state): CartItem[] => {
      return state.cart?.items || []
    },

    /**
     * Get cart totals
     */
    totals: (state): CartTotals | null => {
      return state.cart?.totals || null
    },
  },

  actions: {
    /**
     * Initialize cart token
     */
    initializeToken(): string {
      if (!this.cartToken) {
        this.cartToken = ensureCartToken()
      }
      return this.cartToken
    },

    /**
     * Load cart from API
     */
    async loadCart(): Promise<void> {
      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        const cart = await api.get<Cart>('/cart', undefined, { cart: true })
        this.cart = cart
        
        // Update token if returned by API
        if (cart.token && cart.token !== this.cartToken) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Load cart error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Add item to cart
     * @param variantId - Product variant ID (optional if sku is provided)
     * @param quantity - Quantity to add
     * @param sku - Product variant SKU (optional if variantId is provided)
     * @param idempotencyKey - Optional idempotency key for request deduplication
     */
    async addItem(
      variantId?: number, 
      quantity = 1, 
      sku?: string,
      idempotencyKey?: string
    ): Promise<boolean> {
      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        // Build payload - either variant_id or sku must be provided
        const payload: AddToCartPayload = { qty: quantity }
        if (variantId) {
          payload.variant_id = variantId
        } else if (sku) {
          payload.sku = sku
        } else {
          throw new Error('Either variantId or sku must be provided')
        }

        // Build headers with If-Match (cart version) and optional Idempotency-Key
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        // Add Idempotency-Key if provided
        if (idempotencyKey) {
          headers['Idempotency-Key'] = idempotencyKey
        }

        const cart = await api.post<Cart>('/cart/items', payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        
        this.cart = cart
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to cart error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update item quantity
     */
    async updateItemQuantity(itemId: string, quantity: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: UpdateCartItemPayload = { quantity }
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        const cart = await api.put<Cart>(`/cart/items/${itemId}`, payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        this.cart = cart
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update cart item error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove item from cart
     */
    async removeItem(itemId: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        const cart = await api.delete<Cart>(`/cart/items/${itemId}`, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        this.cart = cart
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove cart item error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update item options (size, color, etc.)
     */
    async updateItemOptions(itemId: string, options: Record<string, string>): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: CartItemOptionsPayload = { options }
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        const cart = await api.put<Cart>(`/cart/items/${itemId}/options`, payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        this.cart = cart
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update item options error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Apply coupon code
     */
    async applyCoupon(code: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: CouponPayload = { code }
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        const response = await api.post<{ cart: Cart; coupon: AppliedCoupon }>('/cart/coupons', payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        
        if (response.cart) {
          this.cart = response.cart
        }
        if (response.coupon) {
          this.appliedCoupons.push(response.coupon)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Apply coupon error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove coupon
     */
    async removeCoupon(code: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const headers: Record<string, string> = {}
        
        // Add If-Match header if cart exists and has version
        if (this.cart?.version !== undefined) {
          headers['If-Match'] = String(this.cart.version)
        }

        const cart = await api.delete<Cart>(`/cart/coupons/${code}`, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        this.cart = cart
        this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== code)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove coupon error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Attach guest cart to authenticated user
     */
    async attachCart(): Promise<void> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      const authStore = useAuthStore()

      // Only attach if user is authenticated and we have a cart token
      if (!authStore.isAuthenticated || !this.cartToken) return

      try {
        const cart = await nuxtApp.runWithContext(async () => 
          await api.post<Cart>('/cart/attach', undefined, { cart: true })
        )
        this.cart = cart
      } catch (error) {
        console.error('Attach cart error:', error)
        // Non-critical - just log the error
      }
    },

    /**
     * Clear cart (used after successful checkout)
     */
    clearCart(): void {
      this.cart = null
      this.appliedCoupons = []
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.cart = null
      this.cartToken = null
      this.loading = false
      this.error = null
      this.appliedCoupons = []
    },
  },
})

