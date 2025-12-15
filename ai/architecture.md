architecture.md — PART 1

(Professional, fully rewritten, clean English version)

📐 Architecture Overview — Full Detailed Specification

This document provides the complete frontend architecture specification for the Nuxt 3 e-commerce project.
It integrates all domains of the platform — Catalog, Cart, Checkout, Auth, Blog, SEO, Payments, System Config, and User Profile — and defines the unified structure required for production-grade implementation.

This file is meant to be used by:

Senior Nuxt developers

System architects

AI agents (such as Claude Opus 4.5)

Teams onboarding to the project

It describes:

Directory structure

Rendering strategy (SSR/CSR)

Token model

API integration model

Stores

Composables

Middleware

SEO architecture

Checkout architecture

Component design

Internal data flows

Error handling rules

1. Project Principles

The frontend architecture follows:

✔ Nuxt 3 Best Practices

Hybrid SSR/CSR rendering

Server routes via /server/api/*

Runtime config for backend URLs

useAsyncData + server-side fetch for SEO-critical pages

✔ Modular Architecture

UI → Components → Composables → Stores → Server API → Backend API

✔ Strong TypeScript Usage

DTOs for every response

Internal models

Utility types for common patterns

Strict linting

✔ API-first Implementation

No assumptions.
Only endpoints defined in api.md may be used.

✔ Clean Atomic Design

atoms

molecules

organisms

templates

✔ Guest-safe Token Model

Tokens stored consistently and safely, across SSR/CSR.

2. Directory Structure (Full)
project/
│
├─ app.vue
├─ nuxt.config.ts
│
├─ pages/
│   ├─ index.vue
│   │
│   ├─ catalog/
│   │   ├─ index.vue
│   │   ├─ [category].vue
│   │   └─ search.vue (optional)
│   │
│   ├─ product/
│   │   └─ [slug].vue
│   │
│   ├─ cart.vue
│   ├─ favorites.vue
│   ├─ comparison.vue
│   │
│   ├─ checkout/
│   │   ├─ index.vue             # /checkout  → start session
│   │   ├─ address.vue           # /checkout/address
│   │   ├─ shipping.vue          # /checkout/shipping
│   │   ├─ payment.vue           # /checkout/payment
│   │   └─ confirm.vue           # /checkout/confirm
│   │
│   ├─ profile/
│   │   ├─ index.vue
│   │   ├─ addresses.vue
│   │   ├─ orders.vue
│   │   └─ order/
│   │       └─ [id].vue
│   │
│   ├─ blog/
│   │   ├─ index.vue
│   │   ├─ [slug].vue
│   │   └─ category/
│   │       └─ [slug].vue
│   │
│   └─ auth/
│       ├─ login.vue
│       ├─ register.vue
│       ├─ forgot-password.vue
│       ├─ reset-password.vue
│       └─ email-verification.vue
│
├─ components/
│   ├─ ui/                       # buttons, inputs, typography
│   ├─ layout/                   # headers, footers
│   ├─ product/
│   ├─ catalog/
│   ├─ cart/
│   ├─ checkout/
│   ├─ blog/
│   ├─ seo/
│   └─ shared/
│
├─ stores/
│   ├─ auth.store.ts
│   ├─ system.store.ts
│   ├─ cart.store.ts
│   ├─ catalog.store.ts
│   ├─ product.store.ts
│   ├─ favorites.store.ts
│   ├─ comparison.store.ts
│   ├─ checkout.store.ts
│   ├─ orders.store.ts
│   ├─ blog.store.ts
│   └─ seo.store.ts
│
├─ composables/
│   ├─ useApi.ts
│   ├─ useAuth.ts
│   ├─ useCart.ts
│   ├─ useCheckout.ts
│   ├─ useFavorites.ts
│   ├─ useComparison.ts
│   ├─ useCatalog.ts
│   ├─ useBlog.ts
│   ├─ useSeo.ts
│   ├─ useLocaleCurrency.ts
│   ├─ usePagination.ts
│   └─ useDebounce.ts
│
├─ server/
│   └─ api/
│       ├─ catalog/
│       ├─ cart/
│       ├─ checkout/
│       ├─ blog/
│       ├─ system/
│       ├─ seo/
│       └─ auth/
│
├─ middleware/
│   ├─ auth.global.ts
│   ├─ guest-token.global.ts
│   ├─ cart-token.global.ts
│   ├─ comparison-token.global.ts
│   ├─ seo.global.ts
│   └─ locale.global.ts
│
├─ types/
│   ├─ auth.ts
│   ├─ cart.ts
│   ├─ catalog.ts
│   ├─ product.ts
│   ├─ checkout.ts
│   ├─ system.ts
│   ├─ blog.ts
│   ├─ seo.ts
│   ├─ orders.ts
│   └─ common.ts
│
├─ utils/
│   ├─ price.ts
│   ├─ format.ts
│   ├─ errors.ts
│   ├─ validator.ts
│   └─ tokens.ts
│
└─ public/
    ├─ images/
    └─ seo/

3. Rendering Strategy (SSR/CSR)
3.1. SSR Pages (Server-Side Rendered)

Used for SEO-critical pages:

✔ Catalog

/catalog

/catalog/:slug

✔ Product Detail Page

/product/:slug

✔ Blog

/blog

/blog/:slug

/blog/category/:slug

✔ Static pages (if any)
✔ System config loader

Loaded SSR to hydrate global state (locale, currency).

3.2. CSR Pages (Client-Side Rendered)
✔ Cart

because dependent on guest token

✔ Favorites
✔ Comparison
✔ Checkout
✔ Profile
✔ Auth
✔ Password reset
✔ Email verification

Client-only because:

token-dependent

user-specific

SEO irrelevant

3.3. Hybrid SSR → CSR Hydration

Catalog and product pages:

SSR loads initial product/facets

CSR updates prices based on selected currency

4. Token Architecture

The platform uses three guest tokens and one user token.

4.1. User token
Authorization: Bearer <token>


Stored in:

Pinia

Cookies (SSR safe)

4.2. Guest Tokens
1) X-Guest-Id

Used by:

Favorites

2) X-Cart-Token

Used by:

Cart

Checkout start

3) X-Comparison-Token

Used by:

Comparison table

These are stored in:

localStorage (CSR)

cookies (SSR fallback)

5. API Access Layer (useApi.ts)

useApi() is the core communication layer.

Responsibilities:

Build endpoint URLs

Inject correct headers

Handle SSR requests

Attach all tokens

Process 401/403 errors

Refresh user state

Throw typed errors

Support retry logic

Automatically apply:

Accept-Language

Accept-Currency

Header Model:
Authorization: Bearer ...
X-Cart-Token: ...
X-Guest-Id: ...
X-Comparison-Token: ...
Accept-Language: en
Accept-Currency: USD

🟦 END OF PART 1

When you're ready →
Say:

“Continue (Part 2)”

и я продолжу формировать полный architecture.md Part 2.

You said:
Continue
ChatGPT said:

Отлично. Продолжаю.

📘 architecture.md — PART 2

+# Identity Module Architecture (NEW)
+
+The backend now exposes a new Identity subsystem under:
+
+```
+/api/v1/identity/*
+```
+
+This module replaces or extends the legacy authentication endpoints.
+
+### Identity Components:
+
+1. **Authentication**
+   - POST /identity/auth/register  
+   - POST /identity/auth/login  
+   - POST /identity/auth/logout  
+
+2. **Profile**
+   - GET /identity/me/profile  
+
+3. **Addresses**
+   - GET /identity/addresses  
+   - POST /identity/addresses  
+   - PUT /identity/addresses/{id}  
+   - DELETE /identity/addresses/{id}
+
+### Identity Responsibilities:
+- centralized authentication
+- profile detail loading
+- standardized address CRUD
+- consistent structure for future modules
+
+### Frontend Architecture Impact:
+- auth.store must use identity API
+- profile pages must consume identity API
+- address management must move into identity.store
+- checkout may reuse identity addresses if available


(Full Detailed English Version)

6. Pinia Stores — Full Architecture

This project uses a large number of interconnected Pinia stores, each responsible for an isolated domain.
Each store is designed for:

Single responsibility

SSR-awareness

API-driven state

Full TypeScript typing

Clean separation of state/actions/getters

Strong error handling

Below is the complete specification for all stores.

6.1 Auth Store (auth.store.ts)

Handles:

registration

login

logout

user hydration

password reset

email verification

profile update

State:
user: null | User
token: string | null
loading: boolean
error: string | null
emailVerificationStatus: "idle" | "sent" | "verified" | "error"
passwordResetStatus: "idle" | "sent" | "reset" | "error"

Actions:
register(payload)

Calls:

POST /auth/register

login(payload)

Calls:

POST /auth/login

logout()

Calls:

POST /auth/logout

fetchUser()

Calls:

GET /auth/user

Password Reset:
POST /forgot-password
POST /reset-password

Email Verification:
GET /verify-email/{id}/{hash}
POST /email/verification-notification



+### Brands (NEW)
+The catalog now exposes a public list of brands:
+```
+GET /api/v1/catalog/brands
+```
+This must be integrated into:
+- catalog.store.ts  
- brand filters  
- brand pages (optional)  


+# Notifications Architecture (NEW)
+
+A brand-new notification subsystem is available under:
+
+```
+/api/v1/notifications/*
+```
+
+This module provides:
+- notification list  
- unread counter  
- notification preferences  
- read-status update  
+
+### Frontend Responsibilities:
+1. **notifications.store.ts** (NEW)
+   - fetch notifications  
+   - mark notification as read  
+   - load unread count  
+   - manage preferences  
+
+2. **UI**
+   - notification bell in header  
+   - unread badge  
+   - notification center page  
+   - preferences page  
+
+### Notes:
+- Unread counter must update automatically  



+---
+# Audience / Email Marketing Architecture (NEW)
+
+The backend now provides a dedicated audience subscription module:
+
+```
+POST   /api/v1/audience/subscribe
+POST   /api/v1/audience/confirm
+DELETE /api/v1/audience/unsubscribe
+```
+
+### Purpose:
+- email marketing  
- newsletter subscription  
- subscription confirmation  
- safe unsubscribe flows  
+
+### Frontend Architecture:
+- audience.store.ts (NEW)
+  - subscribe()
+  - confirm()
+  - unsubscribe()
+- subscribe form component  
+- confirmation page (optional)


6.2 System Store (system.store.ts)

Loads environment-wide settings:

currencies

locales

price range

configuration flags

State:
locales: []
currencies: []
currentLocale: "en"
currentCurrency: "USD"
configuration: {}
loading: false

Actions:
GET /system/config
PUT /system/currency
PUT /system/locale

6.3 Catalog Store (catalog.store.ts)

Handles:

category listing

product listings

filters

sorting

pagination

State:
categories: []
products: []
filters: {}
sorting: "default"
pagination: {
  page: 1,
  perPage: 20,
  total: 0,
  lastPage: 1
}
loading: false

6.4 Product Store (product.store.ts)

Loads a single product variant and its options.

State:
product: null
variants: []
selectedVariant: null
loading: false

API:
GET /catalog/variants/{idOrSlug}

6.5 Cart Store (cart.store.ts)

Handles:

guest cart token

adding/updating/removing items

cart totals

coupons

item options

State:
cart: {
  id: string
  items: []
  totals: {
    subtotal: 0
    shipping: 0
    discounts: 0
    total: 0
  }
}
cartToken: string | null
loading: false
error: null
appliedCoupons: []

API:
Load Cart
GET /cart

Add Item
POST /cart/items

Update Item Qty
PUT /cart/items/{id}

Delete Item
DELETE /cart/items/{id}

Attach Guest Cart on Login
POST /cart/attach

Cart Coupons:
POST /cart/coupons
DELETE /cart/coupons/{code}

Cart Item Options:
PUT /cart/items/{itemId}/options

6.6 Favorites Store (favorites.store.ts)

Stores:

all favorite items

adds/removes favorites

uses guest token (X-Guest-Id)

API:
GET /catalog/favorites
POST /catalog/favorites/{variantId}
DELETE catalog/favorites/{variantId}

6.7 Comparison Store (comparison.store.ts)

Uses token:

X-Comparison-Token

API:
GET /catalog/comparison
POST /catalog/comparison/items
DELETE /catalog/comparison/items/{id}
DELETE /catalog/comparison

6.8 Checkout Store (checkout.store.ts)

Handles EVERYTHING related to checkout.

State (full):
checkoutId: null
items: []
addresses: {
  shipping: null,
  billing: null,
  billingSameAsShipping: true
}
shippingMethods: []
selectedShipping: null
paymentProviders: []
selectedPayment: null
pricing: {
  items: 0,
  shipping: 0,
  discounts: 0,
  total: 0
}
loading: false
error: null
status: "idle" | "address" | "shipping" | "payment" | "confirm"

API:
POST /checkout/start
PUT /checkout/{id}/address
GET /shipping/methods
PUT /checkout/{id}/shipping-method
PUT /checkout/{id}/payment-provider
POST /checkout/{id}/confirm

6.9 Orders Store (orders.store.ts)
API:
GET /orders
GET /orders/{id}

6.10 Blog Store (blog.store.ts)
API:
GET /blog/categories
GET /blog/categories/{slug}
GET /blog/posts
GET /blog/posts/{slug}

6.11 SEO Store (seo.store.ts)

Handles:

fetching SEO metadata

applying metadata via useHead()

caching SSR results

API:
GET /site?url={path}

7. Middleware Architecture

The project uses global middleware to ensure that proper environmental data is always available.

7.1 guest-token.global.ts

Ensures:

X-Guest-Id


exists on first visit.

If not → generate & store in cookie + localStorage.

7.2 cart-token.global.ts

Ensures:

X-Cart-Token


exists prior to accessing /cart or /checkout.

7.3 comparison-token.global.ts

Ensures:

X-Comparison-Token

7.4 auth.global.ts

Redirects:

guest → /auth/login on restricted routes

user → cannot access /auth/login or /auth/register

7.5 locale.global.ts

Loads language + currency from cookies on first SSR request.

7.6 seo.global.ts

On each SSR route:

GET /site?url=currentUrl


Attach metadata via useHead.

7.7 checkout.guard.ts

(optional)

Ensures checkout session exists.

Redirects user to /checkout if they jump into deeper steps.

🟦 END OF PART 2

Готов продолжать.

Скажи:

“Continue (Part 3)”
You said:
Continue
ChatGPT said:

Продолжаю.
Вот architecture.md — PART 3 (full detailed, English).

📘 architecture.md — PART 3

(Full Detailed English Version)

8. SEO Architecture (Full Detailed)

SEO is a critical subsystem of this Nuxt 3 e-commerce frontend.
It ensures the correct metadata is always served for:

catalog pages

product pages

blog pages

blog categories

home page

static pages

cart (noindex)

checkout (noindex)

profile (noindex)

All metadata must be loaded server-side for SEO-critical pages.

8.1 SEO API Endpoint

All SEO data comes from:

GET /api/v1/site?url={path}

Response includes:

title

description

keywords

canonical

robots

text (HTML block for SEO text)

og_image

seoable_id

seoable_type (product, category, blog post…)

8.2 SEO rules by page type
✔ Indexable

/

/catalog

/catalog/:slug

/product/:slug

/blog

/blog/:slug

/blog/category/:slug

✔ Noindex (but follow allowed)

/cart

/comparison

/search

filtered catalog pages with many params

✔ Noindex & nofollow

/profile/*

/checkout/*

/auth/*

8.3 SSR SEO Logic

For every SSR page:

Middleware extracts request URL

Calls SEO API:

GET /site?url=/catalog/fitness


Saves data to seo.store

Injects into:

useHead({
  title,
  meta,
  link (canonical)
})

8.4 CSR SEO Logic

On client-side navigation:

Router triggers afterEach

Runs SEO middleware

Re-fetches metadata

Updates <head> dynamically

Nuxt will swap <title>, <meta>, <link rel="canonical"> on the fly.

8.5 SEO Store Responsibilities
state:
current: null | SeoMeta
loading: boolean

actions:

fetch(url)

apply() → injects metadata

reset()




9. Checkout Architecture (Deep Technical Specification)

Checkout is one of the most complex modules in the app.
It follows a strict linear progression:

Start → Address → Shipping → Payment → Confirm → Order


It is entirely client-side, due to token dependence and user interactivity.

@@
 # Checkout Architecture
 (существующая секция)

+---
+# Single-Page Checkout Architecture (NEW)
+
+The checkout flow must be implemented as a **Single-Page Checkout (SPC)**.
+
+This means:
+- all checkout steps are displayed on **one page**  
- no multi-page routing (`/checkout/address`, `/checkout/shipping`, etc.)  
- the user should never leave `/checkout`
+
+### The SPA Checkout page must include:
+1. **Customer information block**
+   - name
+   - phone
+   - email (optional)
+   - billing details if required
+
+2. **Shipping address**
+   - address form
+   - “billing = shipping” toggle
+
+3. **Shipping methods panel**
+   - load available shipping methods
+   - select method
+
+4. **Payment methods panel**
+   - list payment providers
+   - select provider
+
+5. **Cart summary / order summary**
+   - items
+   - discounts
+   - shipping price
+   - total price
+
+6. **Coupons (if available)**
+   - apply coupon
+   - remove coupon
+
+7. **Order Comments (optional)**
+
+8. **Place Order button**
+
+All sections must be available on a single page and updated dynamically using:
+- checkout.store.ts  
- cart.store.ts  
- system.store.ts (for currency updates)
+
+### API interaction rules remain sequential:
+1. POST /checkout/start  
+2. PUT /checkout/{id}/address  
+3. PUT /checkout/{id}/shipping-method  
+4. PUT /checkout/{id}/payment-provider  
+5. POST /checkout/{id}/confirm  
+
+However, **the frontend UI must not use separate pages** for these steps.
+
+All actions occur dynamically through asynchronous requests from a single Nuxt page:
+```
+/checkout
+```
+
+This ensures:
+- higher conversion
+- fewer navigation steps
+- persistent user context
+- simpler mobile UX


9.1 Checkout Steps & Routes
Step	Route	API
Start	/checkout	POST /checkout/start
Shipping/Billing Address	/checkout/address	PUT /checkout/{id}/address
Shipping Method	/checkout/shipping	GET /shipping/methods
Payment Provider	/checkout/payment	PUT /checkout/{id}/payment-provider
Confirm Order	/checkout/confirm	POST /checkout/{id}/confirm
9.2 Checkout Session Model

Example session object:

{
  id: "chk_123",
  items: [ ... ],
  addresses: {
    shipping: { ... },
    billing: { ... },
    billingSameAsShipping: true
  },
  pricing: {
    items: 10000,
    shipping: 1500,
    discounts: 0,
    total: 11500
  },
  selectedShippingMethod: null,
  selectedPaymentProvider: null
}

9.3 Error Handling (Edge Cases)
❗ Cart Changed During Checkout

If prices or quantity changed:

422 CART_CHANGED
→ reload cart
→ restart checkout

❗ Shipping method invalid

Customer selected outdated shipping method.

422 INVALID_SHIPPING
→ fetch shipping methods again

❗ Payment provider unavailable

If provider is temporarily disabled → show error & reload providers.

9.4 Checkout Must Be CSR Only

Reasons:

Depends on local guest/cart tokens

Sensitive payment provider logic

Prevents double-charging

SSR has no access to payment redirects

SSR mismatches would break checkout

9.5 Checkout UI Components

CheckoutStepper.vue

AddressForm.vue

ShippingMethodCard.vue

PaymentProviderCard.vue

OrderSummary.vue

CheckoutButton.vue

10. Component Architecture (Atomic Design)

The entire UI is organized into:

atoms
molecules
organisms
templates
pages

10.1 Atoms

Smallest reusable components.

Examples:

Buttons

Inputs

Radio / Checkbox

Badge

Price formatting block

Stars rating

10.2 Molecules

Combination of atoms.

Examples:

ProductCard

Pagination

Breadcrumbs

Filter tags

BlogPostCard

10.3 Organisms

Full-featured UI blocks.

Examples:

FiltersSidebar

ProductGallery

CartItem

CheckoutForm

BlogArticle

10.4 Templates

Page layouts.

DefaultLayout.vue

CheckoutLayout.vue

ProfileLayout.vue

11. Data Flow Architecture

Below are high-level system flows.

11.1 Product Page Load Flow
SSR Request
 → load system config
 → load SEO metadata
 → GET /catalog/variants/{idOrSlug}
 → hydrate product.store
 → render product page
client hydration

11.2 Catalog Filter Flow
UI filters changed
 → store.updateFilters()
 → GET /catalog/products?filters...
 → update product list

11.3 Favorites Flow
toggle favorite
 → POST/DELETE /favorites/{id}
 → refetch /favorites

11.4 Comparison Flow
add item
 → POST /comparison/items
load
 → GET /comparison
remove item
 → DELETE /comparison/items/{id}

11.5 Cart Flow
Add item
 → POST /cart/items
Update qty
 → PUT /cart/items/{id}
Apply coupon
 → POST /cart/coupons
Update item options
 → PUT /cart/items/{itemId}/options

11.6 Checkout Flow
Load cart
 → POST /checkout/start
Provide address
 → PUT /checkout/{id}/address
Load shipping methods
 → GET /shipping/methods
Select method
 → PUT /checkout/{id}/shipping-method
Select payment
 → PUT /checkout/{id}/payment-provider
Confirm
 → POST /checkout/{id}/confirm
Redirect to order

12. ERD Models

(High-level conceptual diagrams)

12.1 Product Variant ERD
Product
 ├─ id
 ├─ title
 └─ variants[]
        ├─ id
        ├─ sku
        ├─ slug
        ├─ attribute_values[]
        └─ images[]

12.2 Cart ERD
Cart
 ├─ id
 ├─ items[]
 │    ├─ id
 │    ├─ variant
 │    ├─ quantity
 │    ├─ price_minor
 │    └─ total_minor
 └─ totals{}

12.3 Checkout ERD
Checkout
 ├─ id
 ├─ items[]
 ├─ addresses{}
 ├─ shipping_method
 ├─ payment_provider
 ├─ pricing{}
 └─ status

13. Security Architecture
13.1 Auth

Bearer token auth

Sensitive auth pages CSR

No SSR with user tokens

13.2 Input Validation

Use shared validators for:

Address

Phone

Email

Password

13.3 CSRF

Not required for REST API (token based).
Nuxt handles cookies in SSR context.

13.4 Payments



No sensitive data stored on frontend

Redirects must happen in CSR mode

Payment provider selection is validated server-side

14. Performance Strategy
14.1 Catalog

SSR cache

Lazy loading filters

Component-level caching

14.2 Product

Lazy load images

Prefetch gallery preview

14.3 Blog

Pagination

Partial SSR hydration

14.4 Checkout

Optimize requests:

debounce address changes

preload methods

15. Error Handling Strategy
15.1 Centralized Error Layer (utils/errors.ts)

Handles:

400 — invalid input

401 — unauthorized

403 — forbidden

404 — not found

422 — validation

500 — server error

15.2 Global Error UI

ErrorBanner

Inline field errors

Retry button

Toast notifications

15.3 SSR Errors

Pages must gracefully fall back to client rendering.

🟦 END OF PART 3



## Currency & Locale Reactive Update Rules (ADDED)

Whenever the user changes currency or locale, the frontend must automatically refresh
any price-dependent or locale-dependent data.

- cart store reloads totals
- product store reloads variant
- catalog listing reloads products
- checkout pricing refreshed
- SEO metadata refreshed

## Locale-Specific SEO Metadata (ADDED)

SEO metadata is locale-dependent and must always be fetched through:
Accept-Language: <currentLocale>
