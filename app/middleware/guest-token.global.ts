/**
 * Global middleware to ensure X-Guest-Id token exists
 * Used for favorites functionality
 */

import { ensureGuestToken } from '~/utils/tokens'

export default defineNuxtRouteMiddleware(() => {
  // Ensure guest token exists on every route
  // This runs on both SSR and CSR
  if (import.meta.client) {
    ensureGuestToken()
  }
})

