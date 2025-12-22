/**
 * Checkout domain types
 */

import type { CartItem, CartTotals } from './cart'

export interface Address {
  id?: number
  first_name: string
  last_name: string
  phone: string
  email?: string
  country: string
  region: string
  city: string
  postal: string
  address_line_1: string
  address_line_2?: string
  is_default?: boolean
}

export interface CheckoutAddresses {
  shipping: Address | null
  billing: Address | null
  billingSameAsShipping: boolean
}

export interface ShippingMethod {
  id: number
  code: string
  name: string
  description?: string
  price: number
  currency: string
  estimated_days?: number
  estimated_delivery?: string
}

export interface PaymentProvider {
  code: string
  name: string
  type: 'online' | 'offline'
  fee: number
  icon?: string
  instructions?: string
}

export interface CheckoutPricing {
  items: number
  shipping: number
  discounts: number
  tax?: number
  total: number
  currency: string
}

export interface CheckoutItem extends CartItem {
  // Extended cart item for checkout context
}

export interface CheckoutSession {
  id: string
  items: CheckoutItem[]
  addresses: CheckoutAddresses
  pricing: CheckoutPricing
  selectedShippingMethod: ShippingMethod | null
  selectedPaymentProvider: PaymentProvider | null
  status: CheckoutStatus
}

export type CheckoutStatus = 'idle' | 'address' | 'shipping' | 'payment' | 'confirm' | 'completed'

export interface CheckoutState {
  checkoutId: string | null
  items: CheckoutItem[]
  addresses: CheckoutAddresses
  shippingMethods: ShippingMethod[]
  selectedShipping: ShippingMethod | null
  paymentProviders: PaymentProvider[]
  selectedPayment: PaymentProvider | null
  pricing: CheckoutPricing
  status: CheckoutStatus
  loading: boolean
  error: string | null
}

export interface UpdateAddressPayload {
  shipping_address: Address
  billing_address?: Address
  billing_same_as_shipping: boolean
}

export interface SetShippingMethodPayload {
  method_id: number
}

export interface SetPaymentProviderPayload {
  provider_code: string
}

export interface CheckoutConfirmResponse {
  order_id: number
}

// Payment initialization
export interface PaymentInitPayload {
  order_id: number
}

export interface PaymentInitResponse {
  payment_url: string
  status: string
}

