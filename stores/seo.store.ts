/**
 * SEO Store
 * Handles SEO metadata fetching and application
 */

import { defineStore } from 'pinia'
import type { SeoMeta, SeoState } from '~/types'

export const useSeoStore = defineStore('seo', {
  state: (): SeoState => ({
    current: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Get current page title
     */
    title: (state): string => {
      return state.current?.title || 'DontWorry Shop'
    },

    /**
     * Get current page description
     */
    description: (state): string => {
      return state.current?.description || ''
    },

    /**
     * Check if SEO data is loaded
     */
    isLoaded: (state): boolean => {
      return state.current !== null
    },
  },

  actions: {
    /**
     * Fetch SEO metadata for a URL
     */
    async fetch(url: string): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const seoMeta = await api.get<SeoMeta>('/site', { url })
        this.current = seoMeta
      } catch (error) {
        this.error = 'Failed to load SEO metadata'
        console.error('SEO fetch error:', error)
        // Set fallback
        this.current = {
          title: 'DontWorry Shop',
          description: 'Your trusted e-commerce destination',
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Apply current SEO metadata to document head
     */
    apply(): void {
      if (!this.current) return

      const meta = this.current

      useHead({
        title: meta.title,
        meta: [
          { name: 'description', content: meta.description },
          ...(meta.keywords ? [{ name: 'keywords', content: meta.keywords }] : []),
          ...(meta.robots ? [{ name: 'robots', content: meta.robots }] : []),
          // Open Graph
          ...(meta.og_title ? [{ property: 'og:title', content: meta.og_title }] : []),
          ...(meta.og_description ? [{ property: 'og:description', content: meta.og_description }] : []),
          ...(meta.og_image ? [{ property: 'og:image', content: meta.og_image }] : []),
        ],
        link: [
          ...(meta.canonical ? [{ rel: 'canonical', href: meta.canonical }] : []),
        ],
      })
    },

    /**
     * Reset SEO state
     */
    reset(): void {
      this.current = null
      this.loading = false
      this.error = null
    },
  },
})

