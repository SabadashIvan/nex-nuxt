/**
 * Favorites Store
 * Handles wishlist functionality using X-Guest-Id token
 * CSR-only
 */

import { defineStore } from 'pinia'
import type { ProductVariant } from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface FavoritesState {
  favorites: ProductVariant[]
  loading: boolean
  error: string | null
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favorites: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Number of favorites
     */
    count: (state): number => {
      return state.favorites.length
    },

    /**
     * Check if a variant is in favorites
     */
    isFavorite: (state) => (variantId: number): boolean => {
      return state.favorites.some(f => f.id === variantId)
    },

    /**
     * Check if favorites is empty
     */
    isEmpty: (state): boolean => {
      return state.favorites.length === 0
    },

    /**
     * Get favorite IDs for quick lookup
     */
    favoriteIds: (state): number[] => {
      return state.favorites.map(f => f.id)
    },
  },

  actions: {
    /**
     * Fetch favorites from API
     */
    async fetchFavorites(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const favorites = await api.get<ProductVariant[]>('/catalog/favorites', undefined, { guest: true })
        this.favorites = favorites
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch favorites error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Add variant to favorites
     */
    async addToFavorites(variantId: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.post(`/catalog/favorites/${variantId}`, undefined, { guest: true })
        
        // Refetch to get updated list
        await this.fetchFavorites()
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to favorites error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove variant from favorites
     */
    async removeFromFavorites(variantId: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.delete(`/catalog/favorites/${variantId}`, { guest: true })
        
        // Remove from local state optimistically
        this.favorites = this.favorites.filter(f => f.id !== variantId)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove from favorites error:', error)
        // Refetch on error to ensure consistency
        await this.fetchFavorites()
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle favorite status
     */
    async toggleFavorite(variantId: number): Promise<boolean> {
      if (this.isFavorite(variantId)) {
        return this.removeFromFavorites(variantId)
      } else {
        return this.addToFavorites(variantId)
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.favorites = []
      this.loading = false
      this.error = null
    },
  },
})

