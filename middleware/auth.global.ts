/**
 * Global auth middleware
 * - Redirects guests from protected routes
 * - Redirects authenticated users from auth-only routes
 * Uses session-based authentication (Laravel Sanctum)
 */

import { getActivePinia } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/checkout',
]

// Routes only for guests (logged-out users)
const GUEST_ONLY_ROUTES = [
  '/auth/login',
  '/auth/register',
]

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - session cookies are handled by browser
  if (import.meta.server) return

  // Only try to access store if Pinia is initialized
  const pinia = getActivePinia()
  if (!pinia) {
    // Pinia not available yet - skip auth checks
    return
  }

  const authStore = useAuthStore()
  
  // Initialize auth state if not done yet (check session)
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  const isAuthenticated = authStore.isAuthenticated

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => to.path.startsWith(route))
  
  // Check if route is guest-only
  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some(route => to.path.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }

  // Redirect authenticated users from guest-only routes
  if (isGuestOnlyRoute && isAuthenticated) {
    return navigateTo('/')
  }
})

