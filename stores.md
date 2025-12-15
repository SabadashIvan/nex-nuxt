stores.md — PART 1
Auth, System, Catalog, Product Stores
# Stores Documentation

This document describes all Pinia stores used in the Nuxt 3 e-commerce project.
Each store has a single responsibility and maps directly to a backend domain.

1. Auth Store (auth.store.ts)
Purpose

Handles:

user authentication

registration

logout

token management

user hydration

password reset

email verification

profile updates

State
user: User | null
token: string | null
loading: boolean
error: string | null

emailVerificationStatus: "idle" | "sent" | "verified" | "error"
passwordResetStatus: "idle" | "sent" | "reset" | "error"

Getters
isAuthenticated: boolean
userName: string | null
userEmail: string | null

Actions
login(payload)
POST /auth/login


Save token

Save user

Sync cart via /cart/attach

register(payload)
POST /auth/register

logout()
POST /auth/logout


Clear token

Clear user

fetchUser()
GET /auth/user

Password Reset Actions

Forgot password

POST /forgot-password


Reset password

POST /reset-password

Email Verification Actions
GET /verify-email/{id}/{hash}
POST /email/verification-notification

SSR Behavior

On SSR: load user if token cookie exists

Token stored in cookies for SSR

Never expose token to HTML

Error Handling

Validation errors from 422

Authentication errors from 401

2. System Store (system.store.ts)
Purpose

Handles global system configuration:

locale

currency

system-wide settings

feature toggles

State
locales: []
currencies: []
currentLocale: "en"
currentCurrency: "USD"
systemConfig: {}
loading: boolean

Actions
fetchSystemConfig()
GET /system/config

setLocale(locale)
PUT /system/locale

setCurrency(currency)
PUT /system/currency

SSR Behavior

System config always loaded SSR

Locale & currency read from cookies

3. Catalog Store (catalog.store.ts)
Purpose

Handles:

category tree

product listings

filters & facets

pagination

sorting

caching SSR results

State
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
loading: boolean

Actions
fetchCategories()
GET /catalog/categories

fetchCategory(slug)
GET /catalog/categories/{slug}

fetchProducts(params)
GET /catalog/products

applyFilters(filters)

Update filters + reload products.

applySorting(sort)

Update sorting + reload.

resetFilters()
resetPagination()
SSR Behavior

Category pages SSR-rendered

Product listings SSR-rendered for SEO

Filters applied client-side but initial load via SSR

4. Product Store (product.store.ts)
Purpose

Handles:

loading of single product variant

switching variant options

retrieving variant data

caching last loaded product

State
product: ProductVariant | null
variants: []
selectedVariant: ProductVariant | null
loading: boolean

Actions
fetch(slug)
GET /catalog/variants/{slug}

selectOption(option)

Updates selected option and recalculates available variant.

getVariantByOptions()

Finds matching variant with selected attributes.

SSR Behavior

Product page is fully SSR

Fetch on server: GET /catalog/variants/{slug}

Hydrate store on client

🟦 END OF PART 1

Следующая часть:

👉 stores.md — PART 2 (Cart, Coupons, Item Options, Favorites, Comparison)

Скажи:

Continue (Stores Part 2)
You said:
Continue
ChatGPT said:

Продолжаю.
Вот stores.md — PART 2.

📘 stores.md — PART 2
Cart, Coupons, Item Options, Favorites, Comparison Stores
5. Cart Store (cart.store.ts)
Purpose

The cart store manages:

guest/user cart token

cart items

totals

adding/removing items

updating quantity

applying/removing coupons

updating item-level options

syncing the cart after login

Cart is token-based, not user-bound.

State
cart: {
  id: string | null
  items: CartItem[]
  totals: CartTotals
}
cartToken: string | null
loading: boolean
error: string | null
appliedCoupons: string[]

Getters
itemCount: number
cartTotal: number
discountTotal: number
isEmpty: boolean

Actions
loadCart()
GET /cart

addItem(variantId, quantity)
POST /cart/items

updateItemQuantity(itemId, qty)
PUT /cart/items/{id}

removeItem(itemId)
DELETE /cart/items/{id}

attachCart()

Used after login.

POST /cart/attach

🟦 Coupon Management (NEW)

(Missing in your previous documentation — now fully formalized)

applyCoupon(code)
POST /cart/coupons


On success:

update totals

append to appliedCoupons

On failure:

display validation error (422)

removeCoupon(code)
DELETE /cart/coupons/{code}

🟦 Cart Item Options Management (NEW)

Allows updating per-item attributes such as size/color.

updateItemOptions(itemId, options)
PUT /cart/items/{itemId}/options


Example options:

{
  "color": "red",
  "size": "XL"
}

SSR Behavior

Cart is CSR-only

Tokens required → load only client-side

Never SSR fetch cart

Error Handling

422 for invalid quantity or coupon

400 for malformed options

404 if item removed server-side

6. Favorites Store (favorites.store.ts)
Purpose

Manages a guest/user favorites list using:

X-Guest-Id


Favorites follow “toggle” behavior.

State
favorites: ProductVariant[]
loading: boolean

Actions
fetchFavorites()
GET /favorites

addToFavorites(variantId)
POST /favorites/{variantId}

removeFromFavorites(variantId)
DELETE /favorites/{variantId}

toggleFavorite(variantId)

Calls add or remove depending on state.

SSR Behavior

CSR-only

Controlled by guest token

7. Comparison Store (comparison.store.ts)
Purpose

Handles comparison table via:

X-Comparison-Token


Supports:

viewing items

adding items

removing items

clearing table

State
comparisonToken: string | null
items: ProductVariant[]
loading: boolean

Actions
fetchComparison()
GET /comparison

addToComparison(variantId)
POST /comparison/items

removeFromComparison(itemId)
DELETE /comparison/items/{id}

clearComparison()
DELETE /comparison

SSR Behavior

CSR-only

Comparison token stored in cookie/localStorage

🟦 END OF PART 2

Следующая часть:

👉 stores.md — PART 3 (Checkout, Orders, Blog, SEO)

Скажи:

Continue (Stores Part 3)
You said:
 Continue
ChatGPT said:

Продолжаю.
Вот stores.md — PART 3 (Checkout, Orders, Blog, SEO Stores).

📘 stores.md — PART 3
Checkout, Orders, Blog, SEO Stores
8. Checkout Store (checkout.store.ts)

Checkout is one of the most advanced stores in this project.
It orchestrates the entire multi-step purchase flow.

Purpose

This store manages:

checkout session

addresses (shipping + billing)

shipping methods

payment providers

pricing updates

validation errors

confirmation

This is a client-only store (CSR) because checkout depends on guest/cart tokens.

State
checkoutId: string | null

items: CheckoutItem[]

addresses: {
  shipping: Address | null,
  billing: Address | null,
  billingSameAsShipping: boolean
}

shippingMethods: ShippingMethod[]
selectedShipping: ShippingMethod | null

paymentProviders: PaymentProvider[]
selectedPayment: PaymentProvider | null

pricing: {
  items: number,
  shipping: number,
  discounts: number,
  total: number
}

status: "idle" | "address" | "shipping" | "payment" | "confirm"
loading: boolean
error: string | null

Actions (Full)
startCheckout()

Creates the checkout session.

POST /checkout/start


Updates:

checkoutId

items

pricing

addresses

Status becomes "address".

updateAddress(payload)
PUT /checkout/{id}/address


Payload:

{
  shipping_address: {...},
  billing_address: {...},
  billing_same_as_shipping: boolean
}


Status becomes "shipping".

fetchShippingMethods()
GET /shipping/methods?country=...&city=...


Stores the result into:

shippingMethods[]

applyShippingMethod(methodId)
PUT /checkout/{id}/shipping-method


Updates:

selectedShipping

pricing

Status becomes "payment".

applyPaymentProvider(code)
PUT /checkout/{id}/payment-provider


Status becomes "confirm".

confirmCheckout()
POST /checkout/{id}/confirm


Returns:

order_id

reset()

Resets the entire store (used if the cart changes).

SSR Behavior

Checkout must not run in SSR

All operations are CSR

If SSR tries to load checkout → redirect to /cart

9. Orders Store (orders.store.ts)
Purpose

Manages user orders for:

order list

order details

State
orders: Order[]
order: Order | null
loading: boolean

Actions
fetchOrders()
GET /orders

fetchOrder(id)
GET /orders/{id}

SSR Behavior

Orders are CSR, not SSR

Must have Authorization token

10. Blog Store (blog.store.ts)
Purpose

Handles all blog-related data:

categories

posts list

posts by category

single blog article

Blog is highly SEO-dependent → SSR must be used.

State
categories: BlogCategory[]
posts: BlogPost[]
pagination: Pagination
currentPost: BlogPost | null
loading: boolean

Actions
fetchCategories()
GET /blog/categories

fetchPosts(params)
GET /blog/posts

fetchPost(slug)
GET /blog/posts/{slug}

resetPagination()
SSR Behavior

All blog pages load data via SSR

SEO metadata loaded server-side

Blog posts must use server fetch for best SEO performance

11. SEO Store (seo.store.ts)
Purpose

Handles centralized SEO metadata loading and injection.

Used by:

catalog pages

product pages

blog

home page

some dynamic routes

State
current: SeoMeta | null
loading: boolean
error: string | null

Actions
fetch(url)
GET /site?url={path}


Loads metadata from backend.

apply()

Inject metadata into <head>:

title

meta description

keywords

og:image

canonical link

robots

Using:

useHead({ ... })

reset()

Clear metadata before loading new one.

SSR Behavior

SEO middleware calls fetch() on SSR

Client navigation must re-trigger SEO updates

12. Token Notes

The following stores require tokens:

Store	Tokens
cart	X-Cart-Token
favorites	X-Guest-Id
comparison	X-Comparison-Token
checkout	X-Cart-Token
auth	Bearer token

Stores that require SSR:

catalog.store
product.store
blog.store
seo.store
system.store   (startup load)


Stores that must be CSR:

cart.store
favorites.store
comparison.store
checkout.store
auth.store (partial SSR allowed)
orders.store

🟦 END OF PART 3