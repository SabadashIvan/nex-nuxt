# Checkout Finite State Machine — Source of Truth

Checkout is strictly **CSR-only** and implemented as a **Single-Page Checkout (SPC)**.

## Core rules
- UI uses a single `/checkout` page.
- Backend API sequence is immutable:
  start → address → shipping → payment → confirm
- Skipping or reordering steps is forbidden.

## Required API sequence
1. POST /checkout/start
2. PUT /checkout/{id}/address
3. GET /shipping/methods
4. PUT /checkout/{id}/shipping-method
5. PUT /checkout/{id}/payment-provider
6. POST /checkout/{id}/confirm

## Critical constraints
- Requires X-Cart-Token.
- If cart changes → restart checkout.
- Missing checkout session → redirect to /checkout.
- Checkout logic lives ONLY in checkout.store.ts.

## Errors
- CART_CHANGED → reload cart + restart
- INVALID_SHIPPING → reload methods
- INVALID_PAYMENT → reload providers

## Success
- Redirect to /profile/order/{order_id}
