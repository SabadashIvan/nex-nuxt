/**
 * Cart domain types
 */

import type { ImageValue } from './common'

export interface CartItem {
  id: string
  variant_id: number
  name: string
  slug: string
  sku: string
  image?: ImageValue
  quantity: number
  price: number
  effective_price: number
  total: number
  currency: string
  options?: Record<string, string>
  in_stock: boolean
  max_quantity?: number
}

export interface CartTotals {
  subtotal: number
  shipping: number
  discounts: number
  tax?: number
  total: number
  currency: string
}

export interface Cart {
  id: string
  items: CartItem[]
  totals: CartTotals
  token: string
  items_count: number
}

export interface AddToCartPayload {
  variant_id: number
  quantity: number
}

export interface UpdateCartItemPayload {
  quantity: number
}

export interface CartItemOptionsPayload {
  options: Record<string, string>
}

export interface CouponPayload {
  code: string
}

export interface AppliedCoupon {
  code: string
  discount: number
  type: 'fixed' | 'percentage'
  description?: string
}

export interface CartState {
  cart: Cart | null
  cartToken: string | null
  loading: boolean
  error: string | null
  appliedCoupons: AppliedCoupon[]
}

