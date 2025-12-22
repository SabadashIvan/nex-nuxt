/**
 * Blog domain types
 */

import type { Pagination } from './common'

export interface BlogCategory {
  id: number
  name?: string // Keep for backward compatibility
  title: string
  slug: string
  description?: string
  posts_count?: number
}

export interface BlogPostAuthor {
  id: number
  name: string
  avatar?: string
}

export interface BlogImage {
  id: number
  url: string
}

export interface BlogPostSeo {
  id: number
  path: string
  seoable_id: number
  seoable_type: string
  title: string | null
  description: string | null
  keywords: string | null
  canonical: string | null
  og_image: string | null | '' // Can be null or empty string
  robots: string | null | '' // Can be null or empty string
  text: string | null
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  content?: string
  featured_image?: BlogImage | string | null
  image?: string // Keep for backward compatibility
  category?: BlogCategory
  author?: BlogPostAuthor
  tags?: string[]
  published_at: string
  reading_time?: number
  views_count?: number
  seo?: BlogPostSeo
}

export interface BlogState {
  categories: BlogCategory[]
  posts: BlogPost[]
  currentPost: BlogPost | null
  currentCategory: BlogCategory | null
  pagination: Pagination
  loading: boolean
  error: string | null
}

export interface BlogPostsParams {
  category_id?: number
  category_slug?: string
  search?: string
  page?: number
  per_page?: number
  sort?: 'newest' | 'oldest'
}

/**
 * Blog posts API response structure
 * Matches the actual API response with nested pagination
 */
export interface BlogPostsResponse {
  data: BlogPost[]
  meta: {
    pagination: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

/**
 * Single blog post API response structure
 * Matches the actual API response with data wrapper
 */
export interface BlogPostResponse {
  data: BlogPost
}

