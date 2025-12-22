/**
 * Global SEO middleware
 * Fetches SEO metadata for SSR pages
 */

import { NOINDEX_ROUTES } from '~/types/seo'
import { getActivePinia } from 'pinia'
import { useSeoStore } from '~/stores/seo.store'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip SEO for noindex routes
  const shouldSkipSeo = NOINDEX_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return to.path.startsWith(route.slice(0, -1))
    }
    return to.path === route
  })

  if (shouldSkipSeo) {
    // Apply noindex meta for private routes
    useHead({
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    })
    return
  }

  // Only try to access store if Pinia is initialized
  const pinia = getActivePinia()
  if (!pinia) {
    // Pinia not available yet - apply fallback SEO
    useHead({
      title: 'Nexora Shop',
      meta: [
        { name: 'description', content: 'Your trusted e-commerce destination' },
      ],
    })
    return
  }

  // Fetch SEO metadata for public pages
  try {
    const config = useRuntimeConfig()
    const seoStore = useSeoStore()
    
    // Build full frontend URL
    const siteUrl = config.public.siteUrl as string || 'http://localhost:3000'
    // Use fullPath to include query parameters
    const fullUrl = `${siteUrl}${to.fullPath}`
    
    await seoStore.fetch(fullUrl)
    seoStore.apply(to.fullPath)
  } catch (error) {
    console.error('Failed to fetch SEO metadata:', error)
    // Apply fallback SEO
    useHead({
      title: 'Nexora Shop',
      meta: [
        { name: 'description', content: 'Your trusted e-commerce destination' },
      ],
    })
  }
})
