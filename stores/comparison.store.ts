/**
 * Comparison Store
 * Handles product comparison table using X-Comparison-Token
 * CSR-only
 */

import { defineStore } from 'pinia'
import type { ProductVariant } from '~/types'
import { getErrorMessage } from '~/utils/errors'
import { ensureComparisonToken } from '~/utils/tokens'

interface ComparisonState {
  items: ProductVariant[]
  comparisonToken: string | null
  loading: boolean
  error: string | null
}

// Maximum items in comparison table
const MAX_COMPARISON_ITEMS = 4

export const useComparisonStore = defineStore('comparison', {
  state: (): ComparisonState => ({
    items: [],
    comparisonToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Number of items in comparison
     */
    count: (state): number => {
      return state.items.length
    },

    /**
     * Check if a variant is in comparison
     */
    isInComparison: (state) => (variantId: number): boolean => {
      return state.items.some(item => item.id === variantId)
    },

    /**
     * Check if comparison is empty
     */
    isEmpty: (state): boolean => {
      return state.items.length === 0
    },

    /**
     * Check if comparison is full
     */
    isFull: (state): boolean => {
      return state.items.length >= MAX_COMPARISON_ITEMS
    },

    /**
     * Get comparison item IDs
     */
    itemIds: (state): number[] => {
      return state.items.map(item => item.id)
    },

    /**
     * Get all unique attributes across comparison items
     */
    comparisonAttributes: (state): string[] => {
      const attributeCodes = new Set<string>()
      state.items.forEach(item => {
        item.attributes?.forEach(attr => {
          attributeCodes.add(attr.code)
        })
      })
      return Array.from(attributeCodes)
    },
  },

  actions: {
    /**
     * Initialize comparison token
     */
    initializeToken(): string {
      if (!this.comparisonToken) {
        this.comparisonToken = ensureComparisonToken()
      }
      return this.comparisonToken
    },

    /**
     * Fetch comparison from API
     */
    async fetchComparison(): Promise<void> {
      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        const items = await api.get<ProductVariant[]>('/catalog/comparison', undefined, { comparison: true })
        this.items = items
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch comparison error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Add item to comparison
     */
    async addToComparison(variantId: number): Promise<boolean> {
      // Check if already at max
      if (this.isFull) {
        this.error = `You can compare up to ${MAX_COMPARISON_ITEMS} items`
        return false
      }

      // Check if already in comparison
      if (this.isInComparison(variantId)) {
        return true
      }

      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        await api.post('/catalog/comparison/items', { variant_id: variantId }, { comparison: true })
        
        // Refetch to get updated list
        await this.fetchComparison()
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to comparison error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove item from comparison
     */
    async removeFromComparison(variantId: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.delete(`/catalog/comparison/items/${variantId}`, { comparison: true })
        
        // Remove from local state optimistically
        this.items = this.items.filter(item => item.id !== variantId)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove from comparison error:', error)
        // Refetch on error
        await this.fetchComparison()
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all comparison items
     */
    async clearComparison(): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.delete('/catalog/comparison', { comparison: true })
        this.items = []
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Clear comparison error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle comparison status
     */
    async toggleComparison(variantId: number): Promise<boolean> {
      if (this.isInComparison(variantId)) {
        return this.removeFromComparison(variantId)
      } else {
        return this.addToComparison(variantId)
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.items = []
      this.comparisonToken = null
      this.loading = false
      this.error = null
    },
  },
})

