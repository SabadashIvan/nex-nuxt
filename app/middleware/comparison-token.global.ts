/**
 * Global middleware to ensure X-Comparison-Token exists for comparison pages
 */

import { ensureComparisonToken } from '~/utils/tokens'

export default defineNuxtRouteMiddleware((to) => {
  // Only ensure comparison token for comparison routes
  if (to.path.startsWith('/comparison') && import.meta.client) {
    ensureComparisonToken()
  }
})

