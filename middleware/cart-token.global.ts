/**
 * Global middleware to ensure X-Cart-Token exists for cart/checkout pages
 */

import { ensureCartToken, getToken, TOKEN_KEYS } from '~/utils/tokens'

export default defineNuxtRouteMiddleware((to) => {
  // Only ensure cart token for cart and checkout routes
  const cartRoutes = ['/cart', '/checkout']
  const needsCartToken = cartRoutes.some(route => to.path.startsWith(route))

  if (needsCartToken && import.meta.client) {
    ensureCartToken()
  }

  // Special case: checkout requires a cart token to exist
  if (to.path.startsWith('/checkout') && import.meta.client) {
    const cartToken = getToken(TOKEN_KEYS.CART)
    if (!cartToken) {
      // Redirect to cart if no cart token exists
      return navigateTo('/cart')
    }
  }
})

