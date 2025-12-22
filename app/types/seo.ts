/**
 * SEO domain types
 */

export interface SeoMeta {
  id?: number
  path?: string
  seoable_id?: number | null
  seoable_type?: string | null
  title_h1?: string
  title: string
  description: string
  keywords?: string
  canonical?: string
  robots?: string
  text?: string
  og_image?: string
  og_title?: string
  og_description?: string
}

export interface SeoState {
  current: SeoMeta | null
  loading: boolean
  error: string | null
}

// Pages that should be indexed
export const INDEXABLE_ROUTES = [
  '/',
  '/catalog',
  '/catalog/*',
  '/product/*',
  '/blog',
  '/blog/*',
  '/blog/category/*',
] as const

// Pages that should not be indexed
export const NOINDEX_ROUTES = [
  '/cart',
  '/comparison',
  '/favorites',
  '/checkout',
  '/checkout/*',
  '/profile',
  '/profile/*',
  '/auth',
  '/auth/*',
] as const

