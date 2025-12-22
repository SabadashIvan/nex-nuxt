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
  ApiResponse,
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
     * Get current price (from price object or legacy field)
     */
    currentPrice: (state): number => {
      const variant = state.selectedVariant || state.product
      if (!variant) return 0
      
      if (typeof variant.price === 'object' && variant.price !== null) {
        const priceStr = variant.price.effective_minor || variant.price.sale_minor || '0'
        return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0
      }
      
      return variant.effective_price || 0
    },

    /**
     * Get original price (from price object or legacy field)
     */
    originalPrice: (state): number => {
      const variant = state.selectedVariant || state.product
      if (!variant) return 0
      
      if (typeof variant.price === 'object' && variant.price !== null) {
        const priceStr = variant.price.list_minor || '0'
        return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0
      }
      
      return typeof variant.price === 'number' ? variant.price : 0
    },

    /**
     * Check if product has discount
     */
    hasDiscount: (state): boolean => {
      const variant = state.selectedVariant || state.product
      if (!variant) return false
      
      if (typeof variant.price === 'object' && variant.price !== null) {
        const list = parseFloat(variant.price.list_minor.replace(/[^0-9.]/g, '')) || 0
        const effective = parseFloat(variant.price.effective_minor.replace(/[^0-9.]/g, '')) || 0
        return effective < list
      }
      
      return (variant.effective_price || 0) < (typeof variant.price === 'number' ? variant.price : 0)
    },

    /**
     * Check if product is in stock
     */
    inStock: (state): boolean => {
      const variant = state.selectedVariant || state.product
      if (!variant) return false
      return variant.is_in_stock ?? variant.in_stock ?? false
    },

    /**
     * Get available options (from variant_options or legacy options)
     */
    availableOptions: (state) => {
      const product = state.product
      if (!product) return []
      
      // New structure: variant_options
      if (product.variant_options) {
        // Get current variant's attribute values for matching by label
        const currentAttributeValues = product.attribute_values || []
        
        return product.variant_options.axes.map(axis => {
          const currentAttr = currentAttributeValues.find(av => av.attribute.code === axis.code)
          
          return {
            code: axis.code,
            name: axis.title,
            values: (product.variant_options?.options[axis.code] || []).map(opt => {
              // Find matching attribute value by label to get the code
              const matchingAttr = currentAttributeValues.find(av => 
                av.attribute.code === axis.code && 
                av.label.toLowerCase() === opt.label.toLowerCase()
              )
              
              // Use code from attribute_values if found, otherwise use label as value
              // This ensures we can match variants correctly
              return {
                value: matchingAttr?.code || opt.label,
                label: opt.label,
                is_available: opt.is_in_stock,
                slug: opt.slug,
                value_id: opt.value_id,
              }
            }),
          }
        })
      }
      
      // Legacy structure: options
      return product.options || []
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
        const response = await api.get<ApiResponse<ProductVariant> | ProductVariant>(`/catalog/variants/${slugOrId}`)
        
        console.log('Raw API response:', response)
        console.log('Response type:', typeof response)
        console.log('Has data property:', 'data' in response)
        
        // Handle wrapped response - check if data is wrapped
        let product: ProductVariant
        if ('data' in response && response.data) {
          // Response is wrapped in { data: {...} }
          product = response.data
          console.log('Extracted product from data wrapper:', product)
        } else {
          // Direct response
          product = response as ProductVariant
          console.log('Using direct response as product:', product)
        }
        
        console.log('Final product variant:', {
          id: product?.id,
          title: product?.title,
          hasPrice: !!product?.price,
          hasImages: product?.images?.length > 0,
          hasProduct: !!product?.product,
          priceType: typeof product?.price,
          priceValue: product?.price,
        })
        
        this.product = product
        this.selectedVariant = null
        this.selectedOptions = {}

        // Initialize selected options from attribute_values (new structure) or attributes (legacy)
        if (product.attribute_values && product.attribute_values.length > 0) {
          product.attribute_values.forEach(attr => {
            this.selectedOptions[attr.attribute.code] = attr.code
          })
        } else if (product.attributes && product.attributes.length > 0) {
          product.attributes.forEach(attr => {
            // Legacy structure: attributes may have 'value' field
            const attrValue = (attr as any).value || attr.code
            this.selectedOptions[attr.code] = attrValue
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
      // The value is already the code from attribute_values (set in availableOptions)
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
        // Check attribute_values (new structure)
        if (variant.attribute_values && variant.attribute_values.length > 0) {
          return variant.attribute_values.every(attr => {
            return this.selectedOptions[attr.attribute.code] === attr.code
          })
        }
        
        // Check attributes (legacy structure)
        if (variant.attributes && variant.attributes.length > 0) {
          return variant.attributes.every(attr => {
            // Legacy structure may have 'value' field
            const attrValue = (attr as any).value || attr.code
            return this.selectedOptions[attr.code] === attrValue
          })
        }
        
        return false
      }) || null
    },

    /**
     * Check if an option value is available
     */
    isOptionAvailable(optionCode: string, value: string): boolean {
      if (!this.product) return true
      
      // New structure: variant_options
      if (this.product.variant_options) {
        const options = this.product.variant_options.options[optionCode]
        if (!options) return true
        
        // Value is now the code from attribute_values, so we need to match by label
        // Find the attribute value with this code
        const attributeValue = this.product.attribute_values?.find(av => 
          av.attribute.code === optionCode && av.code === value
        )
        
        if (attributeValue) {
          // Find option by matching label
          const optionValue = options.find(opt => 
            opt.label.toLowerCase() === attributeValue.label.toLowerCase()
          )
          return optionValue?.is_in_stock ?? true
        }
        
        // Fallback: try to match by value_id or slug
        const optionValue = options.find(opt => 
          opt.value_id.toString() === value || opt.slug === value
        )
        return optionValue?.is_in_stock ?? true
      }
      
      // Legacy structure: options
      if (!this.product.options) return true

      const option = this.product.options.find(o => o.code === optionCode)
      if (!option) return true

      const optionValue = option.values.find(v => {
        // Legacy structure has 'value' field
        return (v as any).value === value
      })
      return (optionValue as any)?.is_available ?? true
    },

    /**
     * Get variant for specific options combination
     */
    getVariantForOptions(options: Record<string, string>): ProductVariant | null {
      return this.variants.find(variant => {
        // Check attribute_values (new structure)
        if (variant.attribute_values && variant.attribute_values.length > 0) {
          return variant.attribute_values.every(attr => {
            return options[attr.attribute.code] === attr.code
          })
        }
        
        // Check attributes (legacy structure)
        if (variant.attributes && variant.attributes.length > 0) {
          return variant.attributes.every(attr => {
            // Legacy structure may have 'value' field
            const attrValue = (attr as any).value || attr.code
            return options[attr.code] === attrValue
          })
        }
        
        return false
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

