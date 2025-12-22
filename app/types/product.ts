/**
 * Product domain types
 */

import type { ImageValue } from './common'
import type { ProductPrice, Category } from './catalog'

export interface ProductImage {
  id: number
  url: string
  alt?: string
  is_main?: boolean
  sort_order?: number
}

export interface AttributeValue {
  attribute: {
    title: string
    code: string
  }
  code: string
  label: string
}

export interface ProductBrand {
  id: number
  slug: string
  title: string
}

export interface VariantOptionAxis {
  attribute_id: number
  code: string
  title: string
}

export interface VariantOptionValue {
  value_id: number
  label: string
  slug: string
  is_in_stock: boolean
}

export interface VariantOptions {
  axes: VariantOptionAxis[]
  options: Record<string, VariantOptionValue[]>
}

export interface VariantOption {
  code: string
  name: string
  values: VariantOptionValue[]
}

export interface ProductSpecification {
  group?: string
  items: SpecificationItem[]
}

export interface SpecificationItem {
  name: string
  value: string
}

export interface ProductRating {
  value: number
  count: number
}

export interface ProductData {
  id: number
  description?: string
  brand?: ProductBrand
  categories?: Category[]
  available_options?: unknown[]
}

export interface ProductVariant {
  id: number
  product_id: number
  title: string
  slug: string
  sku: string
  is_favorite: boolean
  price: ProductPrice
  is_in_stock: boolean
  images: ProductImage[]
  attribute_values: AttributeValue[]
  rating?: ProductRating
  product?: ProductData
  variant_options?: VariantOptions
  // Legacy fields for backward compatibility
  name?: string
  effective_price?: number
  currency?: string
  in_stock?: boolean
  attributes?: AttributeValue[]
  specifications?: ProductSpecification[]
  options?: VariantOption[]
  meta_title?: string
  meta_description?: string
  description?: string
  short_description?: string
  quantity?: number
  related_products?: RelatedProduct[]
}

export interface RelatedProduct {
  id: number
  name: string
  slug: string
  price: ProductPrice | number
  effective_price?: number
  image?: ImageValue
}

export interface ProductState {
  product: ProductVariant | null
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  selectedOptions: Record<string, string>
  loading: boolean
  error: string | null
}

