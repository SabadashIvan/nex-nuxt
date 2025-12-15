/**
 * Product Store
 * Handles single product variant loading and option selection
 * SSR-safe for SEO
 */

import { defineStore } from 'pinia'
import type { 
  ProductVariant, 
  ProductState,
  AttributeValue,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

export const useProductStore = defineStore('product', {
  state: (): ProductState => ({
    product: null,
    variants: [],
    selectedVariant: null,
    selectedOptions: {},
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Get current variant (selected or main product)
     */
    currentVariant: (state): ProductVariant | null => {
      return state.selectedVariant || state.product
    },

    /**
     * Get current price
     */
    currentPrice: (state): number => {
      const variant = state.selectedVariant || state.product
      return variant?.effective_price || 0
    },

    /**
     * Get original price
     */
    originalPrice: (state): number => {
      const variant = state.selectedVariant || state.product
      return variant?.price || 0
    },

    /**
     * Check if product has discount
     */
    hasDiscount: (state): boolean => {
      const variant = state.selectedVariant || state.product
      if (!variant) return false
      return variant.effective_price < variant.price
    },

    /**
     * Check if product is in stock
     */
    inStock: (state): boolean => {
      const variant = state.selectedVariant || state.product
      return variant?.in_stock ?? false
    },

    /**
     * Get available options
     */
    availableOptions: (state) => {
      return state.product?.options || []
    },

    /**
     * Get product images
     */
    images: (state) => {
      const variant = state.selectedVariant || state.product
      return variant?.images || []
    },

    /**
     * Get main image
     */
    mainImage: (state): string | undefined => {
      const variant = state.selectedVariant || state.product
      const images = variant?.images || []
      const main = images.find(img => img.is_main)
      return main?.url || images[0]?.url
    },
  },

  actions: {
    /**
     * Fetch product by slug or ID
     */
    async fetch(slugOrId: string): Promise<ProductVariant | null> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const product = await api.get<ProductVariant>(`/catalog/variants/${slugOrId}`)
        this.product = product
        this.selectedVariant = null
        this.selectedOptions = {}

        // Initialize selected options from product attributes
        if (product.attributes) {
          product.attributes.forEach(attr => {
            this.selectedOptions[attr.code] = attr.value
          })
        }

        return product
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch product error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Select an option value
     */
    selectOption(optionCode: string, value: string): void {
      this.selectedOptions[optionCode] = value
      
      // Find matching variant
      const matchingVariant = this.findVariantByOptions()
      if (matchingVariant) {
        this.selectedVariant = matchingVariant
      }
    },

    /**
     * Find variant matching selected options
     */
    findVariantByOptions(): ProductVariant | null {
      if (!this.variants.length) return null

      return this.variants.find(variant => {
        return variant.attributes.every(attr => {
          return this.selectedOptions[attr.code] === attr.value
        })
      }) || null
    },

    /**
     * Check if an option value is available
     */
    isOptionAvailable(optionCode: string, value: string): boolean {
      // Check if any variant with this option value is in stock
      if (!this.product?.options) return true

      const option = this.product.options.find(o => o.code === optionCode)
      if (!option) return true

      const optionValue = option.values.find(v => v.value === value)
      return optionValue?.is_available ?? true
    },

    /**
     * Get variant for specific options combination
     */
    getVariantForOptions(options: Record<string, string>): ProductVariant | null {
      return this.variants.find(variant => {
        return variant.attributes.every(attr => {
          return options[attr.code] === attr.value
        })
      }) || null
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.product = null
      this.variants = []
      this.selectedVariant = null
      this.selectedOptions = {}
      this.loading = false
      this.error = null
    },
  },
})

