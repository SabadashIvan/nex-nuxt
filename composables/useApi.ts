/**
 * Core API composable for all network requests
 * Handles session-based auth, CSRF tokens, SSR/CSR context, and error processing
 */

import type { ApiError } from '~/types'
import { parseApiError, isAuthError } from '~/utils/errors'
import { 
  ensureGuestToken,
  ensureCartToken,
  ensureComparisonToken,
} from '~/utils/tokens'
import { useAuthStore } from '~/stores/auth.store'
import { getActivePinia } from 'pinia'

// API base URL from runtime config
const API_PREFIX = '/api/v1'

// Endpoints that are NOT prefixed with /api/v1 (Laravel Sanctum SPA auth endpoints)
const NON_PREFIXED_ENDPOINTS = [
  '/sanctum/csrf-cookie',
  '/login',
  '/register',
  '/logout',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/email',
]

export interface UseApiOptions {
  /** Include session credentials (cookies) - default true for auth */
  credentials?: boolean
  /** Include cart token */
  cart?: boolean
  /** Include guest token */
  guest?: boolean
  /** Include comparison token */
  comparison?: boolean
  /** Custom headers */
  headers?: Record<string, string>
  /** Retry on failure */
  retry?: number
  /** Skip API prefix (for non-standard endpoints) */
  raw?: boolean
}

export interface ApiRequestOptions extends UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | string[] | undefined>
}

/**
 * Check if endpoint should skip /api/v1 prefix
 */
function shouldSkipPrefix(endpoint: string): boolean {
  return NON_PREFIXED_ENDPOINTS.some(prefix => endpoint.startsWith(prefix))
}

/**
 * Get XSRF token from cookie for CSRF protection
 */
function getXsrfToken(): string | null {
  if (import.meta.server) return null
  
  // Laravel stores XSRF token in a cookie named XSRF-TOKEN
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  if (match) {
    // The cookie value is URL-encoded
    return decodeURIComponent(match[1])
  }
  return null
}

/**
 * Main API composable
 */
export function useApi() {
  const config = useRuntimeConfig()
  
  /**
   * Get the base URL for API requests
   * - SSR: Use full backend URL (server-to-server)
   * - CSR: Use full backend URL from public config
   */
  function getBaseUrl(): string {
    if (import.meta.server) {
      // Server-side: direct connection to backend
      return (config.apiBackendUrl as string) || 'http://localhost:8000'
    }
    // Client-side: use backend URL from public config
    return (config.public.apiBackendUrl as string) || 'http://localhost:8000'
  }
  
  /**
   * Fetch CSRF cookie from Laravel Sanctum
   * Must be called before login/register requests
   * Goes through Nuxt server route to avoid CORS
   */
  async function fetchCsrfCookie(): Promise<void> {
    const baseUrl = getBaseUrl()
    
    await $fetch(`${baseUrl}/sanctum/csrf-cookie`, {
      credentials: 'include',
    })
  }

  /**
   * Build request headers with tokens
   */
  function buildHeaders(options: UseApiOptions = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Get locale/currency from cookies (works for both SSR and CSR)
    // We always use cookies to avoid Pinia context issues during SSR
    // Cookies are kept in sync with store values by the system store
    const localeCookie = useCookie('locale')
    const currencyCookie = useCookie('currency')
    
    if (localeCookie.value) {
      headers['Accept-Language'] = localeCookie.value
    } else {
      // Default fallback
      headers['Accept-Language'] = 'en'
    }
    
    if (currencyCookie.value) {
      headers['Accept-Currency'] = currencyCookie.value
    } else {
      // Default fallback
      headers['Accept-Currency'] = 'USD'
    }

    // Add XSRF token for CSRF protection (Laravel Sanctum)
    const xsrfToken = getXsrfToken()
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }

    // Add cart token
    if (options.cart) {
      const cartToken = ensureCartToken()
      headers['X-Cart-Token'] = cartToken
    }

    // Add guest token
    if (options.guest) {
      const guestToken = ensureGuestToken()
      headers['X-Guest-Id'] = guestToken
    }

    // Add comparison token
    if (options.comparison) {
      const comparisonToken = ensureComparisonToken()
      headers['X-Comparison-Token'] = comparisonToken
    }

    // Merge custom headers
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    return headers
  }

  /**
   * Build full URL with query params
   */
  function buildUrl(
    endpoint: string, 
    query?: Record<string, string | number | boolean | string[] | undefined>,
    options?: UseApiOptions
  ): string {
    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    // Determine if we should add the /api/v1 prefix
    let path: string
    if (options?.raw || shouldSkipPrefix(normalizedEndpoint) || normalizedEndpoint.startsWith('/api/v1')) {
      path = normalizedEndpoint
    } else {
      path = `${API_PREFIX}${normalizedEndpoint}`
    }
    
    // Build query string
    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays for filters[attributes][] format
          if (Array.isArray(value)) {
            value.forEach((item) => {
              params.append(key, String(item))
            })
          } else {
            params.append(key, String(value))
          }
        }
      })
      let queryString = params.toString()
      // Decode square brackets in keys (filters[price_min] should not be filters%5Bprice_min%5D)
      if (queryString) {
        queryString = queryString.replace(/%5B/g, '[').replace(/%5D/g, ']')
        path = `${path}?${queryString}`
      }
    }

    return path
  }

  /**
   * Core fetch function
   */
  async function request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, query, retry = 0, credentials = true, ...headerOptions } = options
    
    const path = buildUrl(endpoint, query, headerOptions)
    const headers = buildHeaders(headerOptions)

    // All requests go directly to backend (both SSR and CSR)
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}${path}`

    // Auth endpoints that should not trigger auto-logout on errors
    const isAuthEndpoint = ['/login', '/register', '/logout', '/forgot-password', '/reset-password'].some(
      authPath => endpoint.startsWith(authPath) || endpoint.includes(authPath)
    )

    try {
      const response = await $fetch<T>(url, {
        method,
        headers,
        body: body ? body : undefined,
        retry,
        // Include credentials for session-based auth (cookies)
        credentials: credentials ? 'include' : 'omit',
      })

      return response
    } catch (error: unknown) {
      const apiError = parseApiError(error)
      
      // Handle auth errors globally (but not during auth flows)
      // Only handle on client side to avoid Pinia context issues during SSR
      if (isAuthError(apiError) && !isAuthEndpoint && import.meta.client) {
        try {
          // Check if Pinia is available before accessing store
          // getActivePinia() returns null if Pinia isn't initialized
          const pinia = getActivePinia()
          if (pinia) {
            try {
              const authStore = useAuthStore()
              await authStore.logout()
              
              // Redirect to login
              const router = useRouter()
              router.push('/auth/login')
            } catch (storeError) {
              // Store access failed, skip auto-logout
              console.warn('Could not access auth store for auto-logout:', storeError)
            }
          }
        } catch {
          // Pinia check failed, skip auto-logout
        }
      }

      throw apiError
    }
  }

  /**
   * GET request
   */
  async function get<T>(
    endpoint: string,
    query?: Record<string, string | number | boolean | string[] | undefined>,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET', query })
  }

  /**
   * POST request
   */
  async function post<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  async function put<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH request
   */
  async function patch<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  async function del<T>(
    endpoint: string,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    fetchCsrfCookie,
    buildHeaders,
    buildUrl,
  }
}

/**
 * SSR-safe async data fetching
 * Use for SSR pages that need SEO
 */
export function useApiData<T>(
  key: string,
  endpoint: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined>
    apiOptions?: UseApiOptions
    transform?: (data: T) => T
    default?: () => T
    lazy?: boolean
    server?: boolean
    immediate?: boolean
  }
) {
  const api = useApi()
  
  return useAsyncData<T>(
    key,
    () => api.get<T>(endpoint, options?.query, options?.apiOptions),
    {
      transform: options?.transform,
      default: options?.default,
      lazy: options?.lazy,
      server: options?.server,
      immediate: options?.immediate,
    }
  )
}

// Type exports
export type { ApiError }

