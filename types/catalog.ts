/**
 * Catalog domain types
 */

import type { Pagination } from './common'

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  parent_id?: number | null
  children?: Category[]
  products_count?: number
}

export interface ProductFilter {
  // Query parameters (top-level, not nested)
  page?: number
  per_page?: number
  sort?: 'newest' | 'price_asc' | 'price_desc'
  include_facets?: boolean
  
  // Filter parameters (nested under filters.* prefix in query string)
  // These map to: filters.q, filters.price_min, filters.brands, etc.
  filters?: {
    q?: string // Search query -> filters.q
    price_min?: string | number // -> filters.price_min (sent as string)
    price_max?: string | number // -> filters.price_max (sent as string)
    brands?: string // Comma-separated brand IDs: "1,3,5" -> filters.brands
    categories?: string // Comma-separated category IDs: "10,12" -> filters.categories
    attributes?: string[] // Array of comma-separated values: ["4,5", "7,8"] -> filters.attributes[0], filters.attributes[1]
  }
}

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  code: string
  name: string
  type: 'checkbox' | 'range' | 'select'
  options?: FilterOption[]
  min?: number
  max?: number
}

export interface CatalogFilters {
  categories?: FilterOption[]
  attributes?: FilterGroup[]
  price_range?: {
    min: number
    max: number
  }
}

export interface CatalogState {
  categories: Category[]
  products: ProductListItem[]
  filters: ProductFilter
  availableFilters: CatalogFilters
  sorting: string
  pagination: Pagination
  loading: boolean
}

export interface ProductImage {
  id: number
  url: string
}

export interface VariantOptionValue {
  value_id: number
  label: string
  slug: string
  is_in_stock: boolean
}

export interface VariantOptions {
  axes: Array<{
    attribute_id: number
    code: string
    title: string
  }>
  options: Record<string, VariantOptionValue[]>
}

export interface ProductPrice {
  currency: string
  list_minor: string
  sale_minor: string
  effective_minor: string
}

export interface ProductListItem {
  id: number
  sku: string
  slug: string
  title: string
  is_favorite: boolean
  images: ProductImage[]
  price: ProductPrice
  is_in_stock: boolean
  variant_options: VariantOptions
}

export interface VariantsResponse {
  data: {
    items: ProductListItem[]
    facets?: {
      categories?: Array<{
        id: number
        title: string
        slug: string | null
        count: number
        selected: boolean
      }>
      brands?: Array<{
        id: number
        title: string
        slug: string | null
        count: number
        selected: boolean
      }>
      attributes?: Array<{
        id: number
        code: string
        title: string
        values: Array<{
          id: number
          label: string
          count: number
          selected: boolean
        }>
      }>
      price?: {
        min: number
        max: number
      }
    }
  }
  meta: {
    pagination: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo?: string
}

// Re-export VariantsResponse for convenience
export type { VariantsResponse }

