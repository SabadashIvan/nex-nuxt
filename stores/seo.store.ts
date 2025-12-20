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
     * Get current page H1 title
     */
    titleH1: (state): string | undefined => {
      return state.current?.title_h1
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
     * Fetch SEO metadata for a full frontend URL
     * @param fullUrl - Full frontend URL (e.g., https://example.com/catalog)
     */
    async fetch(fullUrl: string): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<{ data: SeoMeta }>('/site', { url: fullUrl })
        // API returns { data: { ... } } structure
        this.current = response.data
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
    apply(fullPath?: string): void {
      if (!this.current) return

      const meta = this.current
      const config = useRuntimeConfig()

      // Build canonical URL - use provided canonical or build from current URL
      let canonicalUrl = meta.canonical
      if (!canonicalUrl && typeof window !== 'undefined') {
        canonicalUrl = window.location.href
      } else if (!canonicalUrl) {
        // SSR: build from siteUrl and provided path
        const siteUrl = config.public.siteUrl as string || 'http://localhost:3000'
        const safePath = fullPath || '/'
        canonicalUrl = `${siteUrl}${safePath}`
      }

      useHead({
        title: meta.title,
        meta: [
          { name: 'description', content: meta.description },
          ...(meta.keywords ? [{ name: 'keywords', content: meta.keywords }] : []),
          ...(meta.robots ? [{ name: 'robots', content: meta.robots }] : []),
          // Open Graph - use og_* fields if provided, otherwise fallback to title/description
          { property: 'og:title', content: meta.og_title || meta.title },
          { property: 'og:description', content: meta.og_description || meta.description },
          ...(meta.og_image ? [{ property: 'og:image', content: meta.og_image }] : []),
        ],
        link: [
          ...(canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : []),
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
