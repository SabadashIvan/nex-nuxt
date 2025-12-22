/**
 * Token management utilities for cookies and localStorage
 * Note: Auth is now session-based (Laravel Sanctum), no auth tokens needed
 */

// Token keys (AUTH removed - now using session cookies)
export const TOKEN_KEYS = {
  CART: 'cart_token',
  GUEST: 'guest_id',
  COMPARISON: 'comparison_token',
  LOCALE: 'locale',
  CURRENCY: 'currency',
} as const

// Cookie options
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Generate a UUID v4 for guest tokens
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get token from cookie (SSR-safe)
 * During SSR, uses getCookie() to avoid triggering cookie writes
 * During client, uses useCookie() for reactivity
 */
export function getTokenFromCookie(key: string): string | null {
  if (import.meta.server) {
    // During SSR, use getCookie() which only reads, doesn't write
    // This prevents cookie write attempts during SWR cache handling
    try {
      const event = useRequestEvent()
      if (event) {
        const value = getCookie(event, key)
        return value || null
      }
      return null
    } catch {
      // If we can't get the event (e.g., during SWR cache handling),
      // return null instead of using useCookie() which would trigger writes
      return null
    }
  }
  // On client, use useCookie() for reactivity
  try {
    const cookie = useCookie(key)
    return cookie.value || null
  } catch {
    // Fallback if useCookie() fails
    return null
  }
}

/**
 * Set token in cookie (SSR-safe)
 * Only sets cookies on client to avoid issues during SWR cache handling
 */
export function setTokenInCookie(key: string, value: string): void {
  // Only set cookies on client side to avoid header issues during SSR/SWR
  if (import.meta.client) {
    try {
      const cookie = useCookie(key, COOKIE_OPTIONS)
      cookie.value = value
    } catch (error) {
      // Silently fail if cookie can't be set
      if (import.meta.dev) {
        console.warn(`Failed to set cookie ${key}:`, error)
      }
    }
  }
  // During SSR, we don't set cookies to avoid "headers already sent" errors
  // Cookies will be set on the client side
}

/**
 * Remove token from cookie (SSR-safe)
 * Only removes cookies on client to avoid issues during SWR cache handling
 */
export function removeTokenFromCookie(key: string): void {
  // Only remove cookies on client side to avoid header issues during SSR/SWR
  if (import.meta.client) {
    try {
      const cookie = useCookie(key)
      cookie.value = null
    } catch (error) {
      // Silently fail if cookie can't be removed
      if (import.meta.dev) {
        console.warn(`Failed to remove cookie ${key}:`, error)
      }
    }
  }
  // During SSR, we don't remove cookies to avoid "headers already sent" errors
  // Cookies will be removed on the client side
}

/**
 * Get token from localStorage (CSR only)
 */
export function getTokenFromStorage(key: string): string | null {
  if (import.meta.server) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Set token in localStorage (CSR only)
 */
export function setTokenInStorage(key: string, value: string): void {
  if (import.meta.server) return
  try {
    localStorage.setItem(key, value)
  } catch {
    console.warn(`Failed to save ${key} to localStorage`)
  }
}

/**
 * Remove token from localStorage
 */
export function removeTokenFromStorage(key: string): void {
  if (import.meta.server) return
  try {
    localStorage.removeItem(key)
  } catch {
    console.warn(`Failed to remove ${key} from localStorage`)
  }
}

/**
 * Get token with fallback (cookie first, then localStorage)
 */
export function getToken(key: string): string | null {
  return getTokenFromCookie(key) || getTokenFromStorage(key)
}

/**
 * Set token in both cookie and localStorage
 */
export function setToken(key: string, value: string): void {
  setTokenInCookie(key, value)
  setTokenInStorage(key, value)
}

/**
 * Remove token from both cookie and localStorage
 */
export function removeToken(key: string): void {
  removeTokenFromCookie(key)
  removeTokenFromStorage(key)
}

/**
 * Ensure guest token exists, create if not
 */
export function ensureGuestToken(): string {
  let token = getToken(TOKEN_KEYS.GUEST)
  if (!token) {
    token = generateUUID()
    setToken(TOKEN_KEYS.GUEST, token)
  }
  return token
}

/**
 * Ensure cart token exists, create if not
 */
export function ensureCartToken(): string {
  let token = getToken(TOKEN_KEYS.CART)
  if (!token) {
    token = generateUUID()
    setToken(TOKEN_KEYS.CART, token)
  }
  return token
}

/**
 * Ensure comparison token exists, create if not
 */
export function ensureComparisonToken(): string {
  let token = getToken(TOKEN_KEYS.COMPARISON)
  if (!token) {
    token = generateUUID()
    setToken(TOKEN_KEYS.COMPARISON, token)
  }
  return token
}

/**
 * Clear all tokens (full reset)
 * Note: Does not affect session cookies (handled by Laravel Sanctum)
 */
export function clearAllTokens(): void {
  Object.values(TOKEN_KEYS).forEach(key => removeToken(key))
}
