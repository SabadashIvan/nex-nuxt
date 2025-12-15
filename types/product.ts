/**
 * Product domain types
 */

export interface ProductImage {
  id: number
  url: string
  alt?: string
  is_main?: boolean
  sort_order?: number
}

export interface AttributeValue {
  code: string
  name: string
  value: string
  display_value?: string
}

export interface VariantOption {
  code: string
  name: string
  values: VariantOptionValue[]
}

export interface VariantOptionValue {
  value: string
  label: string
  is_available: boolean
  variant_id?: number
}

export interface ProductSpecification {
  group?: string
  items: SpecificationItem[]
}

export interface SpecificationItem {
  name: string
  value: string
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  slug: string
  sku: string
  price: number
  effective_price: number
  currency: string
  in_stock: boolean
  quantity?: number
  description?: string
  short_description?: string
  images: ProductImage[]
  attributes: AttributeValue[]
  specifications?: ProductSpecification[]
  options?: VariantOption[]
  meta_title?: string
  meta_description?: string
  rating?: number
  reviews_count?: number
  related_products?: RelatedProduct[]
}

export interface RelatedProduct {
  id: number
  name: string
  slug: string
  price: number
  effective_price: number
  image?: string
}

export interface ProductState {
  product: ProductVariant | null
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  selectedOptions: Record<string, string>
  loading: boolean
  error: string | null
}

