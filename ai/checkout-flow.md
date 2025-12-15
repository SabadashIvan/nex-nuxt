checkout-flow.md — FULL DETAILED VERSION
Complete Checkout Flow Specification for Nuxt 3 E-commerce Frontend

This document defines the complete, production-grade checkout flow, matching backend API and frontend architecture.

It is essential for:

Frontend engineers

QA testers

AI agents (Claude Opus 4.5)

Documentation reviewers

UX designers

Checkout is completely client-side (CSR) and depends heavily on:

X-Cart-Token

authenticated user (optional)

consistent pricing logic

sequential steps

validation rules

shipping/payment provider availability

1. High-Level Checkout Stages

The checkout flow contains five strict sequential steps:

1. Start
2. Address
3. Shipping
4. Payment
5. Confirm


Each step corresponds to a Nuxt page:

Step	Route	Purpose
1	/checkout	Start session & redirect
2	/checkout/address	Shipping/Billing address
3	/checkout/shipping	Shipping method selection
4	/checkout/payment	Payment provider selection
5	/checkout/confirm	Final confirmation
2. Checkout API Map
Step	API Endpoint	Method	Description
Start	/checkout/start	POST	Creates checkout session
Address	/checkout/{id}/address	PUT	Saves shipping & billing address
Shipping Methods	/shipping/methods	GET	Returns available shipping methods
Shipping Selection	/checkout/{id}/shipping-method	PUT	Sets chosen shipping method
Payment Provider	/checkout/{id}/payment-provider	PUT	Sets payment type
Confirm	/checkout/{id}/confirm	POST	Creates final order
3. Checkout Data Model
3.1 Checkout Session

Represents the entire state of the checkout.

{
  id: string,
  items: CheckoutItem[],
  addresses: {
    shipping: Address | null,
    billing: Address | null,
    billingSameAsShipping: boolean
  },
  pricing: {
    items: number,
    shipping: number,
    discounts: number,
    total: number
  },
  selectedShippingMethod: ShippingMethod | null,
  selectedPaymentProvider: PaymentProvider | null
}

3.2 Address Model
{
  first_name: string,
  last_name: string,
  phone: string,
  country: string,
  region: string,
  city: string,
  postal: string,
  address_line_1: string,
  address_line_2?: string
}

3.3 Shipping Method
{
  id: number,
  name: string,
  price: number,
  estimated_days: number
}

3.4 Payment Provider
{
  code: string,
  name: string,
  type: "online" | "offline",
  fee: number,
  instructions?: string
}

4. Detailed Flow per Step
4.1 Step 1 — Start (/checkout)
Tasks:

Ensure X-Cart-Token exists

Load cart

Call:

POST /checkout/start

Response sets:

checkoutId

pricing

items

addresses (previous saved data)

Then:

Redirect to /checkout/address

4.2 Step 2 — Address (/checkout/address)
User provides:

Shipping address

Billing address

“Billing same as shipping” toggle

API:
PUT /checkout/{id}/address

Validation:

required fields

valid country

valid postal code

phone validation

On success:

Redirect to:

/checkout/shipping

4.3 Step 3 — Shipping (/checkout/shipping)
Steps:

Fetch shipping options:

GET /shipping/methods


User selects one

Save selection:

PUT /checkout/{id}/shipping-method


Prices update

On success:

Redirect to:

/checkout/payment

4.4 Step 4 — Payment (/checkout/payment)
Steps:

Load providers (from system config or a specific endpoint)

User selects provider

Save provider:

PUT /checkout/{id}/payment-provider


Provider selection appears in summary

On success:

Redirect to:

/checkout/confirm

4.5 Step 5 — Confirm (/checkout/confirm)
Tasks:

Show summary

Show selected:

address

shipping

payment

items

total

Confirm call:
POST /checkout/{id}/confirm

Response:
{ "order_id": 8192 }

Then redirect to:
/profile/order/{order_id}

5. Edge Cases & Error Handling

Checkout must gracefully handle broken states.

5.1 Cart changed during checkout
422 CART_CHANGED


Fix:

reload cart

restart checkout

5.2 Shipping method invalid

Occurs when user takes too long.

422 INVALID_SHIPPING


Fix:

reload shipping methods

force choosing again

5.3 Invalid payment provider
422 INVALID_PAYMENT


Fix:

reload providers

show detailed error message

5.4 Checkout session expired

Fix:

call /checkout/start again

repopulate addresses if possible

5.5 Missing cart token

Fix:

redirect to /cart

allow restart

6. How Checkout Connects to Other Systems
6.1 Cart Integration

Checkout depends on cart items:

item changes outside checkout break session

cart coupons modify pricing

cart item options modify pricing

6.2 Payments Integration

The selected provider determines:

redirect-based flow

offline instructions

status handling

6.3 System Config Integration

Locale and currency affect:

shipping costs

item prices

currency formatting

6.4 SEO

Checkout is always:

noindex, nofollow


So no SSR SEO needed.

7. UI Components (Full List)

CheckoutStepper.vue

AddressForm.vue

BillingAddressForm.vue

ShippingMethodCard.vue

PaymentProviderCard.vue

OrderSummary.vue

CheckoutButton.vue

AddressPreview.vue

ShippingPreview.vue

PaymentPreview.vue

8. User Experience Requirements

Do not overwhelm users with long forms

Autofill billing = shipping

Show delivery ETA

Always show order summary sidebar

Show clear progress via CheckoutStepper

Validate fields inline

Show loading states

Disable buttons during API calls

🟦 END OF CHECKOUT-FLOW.MD