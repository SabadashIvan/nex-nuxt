/**
 * Core API composable for all network requests
 * Handles cookie-based Sanctum auth, CSRF tokens, SSR/CSR context, and error processing
 */

import { useNuxtApp, useRouter, useRuntimeConfig, useCookie, useRequestEvent, useRequestHeaders } from '#app'
import { getCookie } from 'h3'
import type { ApiError } from '~/types'
import { parseApiError, isAuthError } from '~/utils/errors'
import { generateUUID } from '~/utils/tokens'
import { useAuthStore } from '~/stores/auth.store'

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
 * Works in both SSR and CSR contexts
 */
function getXsrfToken(event?: ReturnType<typeof useRequestEvent>): string | null {
  if (import.meta.server) {
    // During SSR, read from request event
    if (event) {
      const token = getCookie(event, 'XSRF-TOKEN')
      if (token) {
        return decodeURIComponent(token)
      }
    }
    return null
  }
  
  // On client, read from document.cookie
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
  // 1. Сразу захватываем все нужные инстансы в синхронной части setup
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  const router = useRouter()
  
  // Lazy cookie access - only access cookies when needed and only on client
  // This prevents cookie writes during SSR/SWR cache handling
  function getCookieValue(key: string): string | null {
    if (import.meta.server) {
      // During SSR, use getCookie() which only reads, doesn't write
      try {
        const event = useRequestEvent()
        if (event) {
          return getCookie(event, key) || null
        }
      } catch {
        // If we can't get the event (e.g., during SWR cache handling),
        // return null instead of using useCookie() which would trigger writes
        return null
      }
      return null
    }
    // On client, use useCookie() for reactivity
    try {
      const cookie = useCookie(key)
      return cookie.value || null
    } catch {
      return null
    }
  }
  
  function setCookieValue(key: string, value: string): void {
    // Only set cookies on client side to avoid header issues during SSR/SWR
    if (import.meta.client) {
      try {
        const cookie = useCookie(key)
        cookie.value = value
      } catch (error) {
        if (import.meta.dev) {
          console.warn(`Failed to set cookie ${key}:`, error)
        }
      }
    }
  }
  
  /**
   * Get the base URL for API requests
   * - SSR: Use full backend URL (server-to-server)
   * - CSR: Use full backend URL from public config
   */
  function getBaseUrl(): string {
    return import.meta.server
      ? (config.apiBackendUrl as string || 'http://localhost:8000')
      : (config.public.apiBackendUrl as string || 'http://localhost:8000')
  }
  
  // CSRF token cache to avoid multiple requests
  let csrfTokenCache: string | null = null
  let csrfTokenFetched = false

  /**
   * Fetch CSRF cookie from Laravel Sanctum
   * Must be called before POST/PUT/PATCH/DELETE requests
   * Caches the token to avoid multiple requests
   */
  async function fetchCsrfCookie(): Promise<void> {
    // If we already have a token cached, skip
    if (csrfTokenCache && csrfTokenFetched) {
      return
    }

    const baseUrl = getBaseUrl()
    
    try {
      await nuxtApp.runWithContext(async () => {
        await $fetch(`${baseUrl}/sanctum/csrf-cookie`, {
          method: 'GET',
          credentials: 'include',
        })
      })
      
      // Mark as fetched (token will be read from cookie on next request)
      csrfTokenFetched = true
      
      // Clear cache to force reading fresh token from cookie
      csrfTokenCache = null
    } catch (error) {
      console.error('Failed to fetch CSRF cookie:', error)
      throw error
    }
  }

  /**
   * Clear CSRF token cache (useful after logout or on 419 error)
   */
  function clearCsrfCache(): void {
    csrfTokenCache = null
    csrfTokenFetched = false
  }

  /**
   * Build request headers with tokens
   * Uses lazy cookie access to avoid writes during SSR/SWR cache handling
   */
  function buildHeaders(options: UseApiOptions = {}, event?: ReturnType<typeof useRequestEvent>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': getCookieValue('locale') || 'en',
      'Accept-Currency': getCookieValue('currency') || 'USD',
    }

    // Add XSRF token for CSRF protection (Laravel Sanctum)
    // For modifying requests, XSRF token is required
    const xsrfToken = getXsrfToken(event)
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
      // Cache the token
      csrfTokenCache = xsrfToken
    }

    // Add cart token - use lazy cookie access to avoid context issues
    if (options.cart) {
      let cartToken = getCookieValue('cart_token')
      if (!cartToken) {
        // Generate new token if doesn't exist
        cartToken = generateUUID()
        setCookieValue('cart_token', cartToken)
      }
      headers['X-Cart-Token'] = cartToken
    }

    // Add guest token - use lazy cookie access to avoid context issues
    if (options.guest) {
      let guestToken = getCookieValue('guest_id')
      if (!guestToken) {
        // Generate new token if doesn't exist
        guestToken = generateUUID()
        setCookieValue('guest_id', guestToken)
      }
      headers['X-Guest-Id'] = guestToken
    }

    // Add comparison token - use lazy cookie access to avoid context issues
    if (options.comparison) {
      let comparisonToken = getCookieValue('comparison_token')
      if (!comparisonToken) {
        // Generate new token if doesn't exist
        comparisonToken = generateUUID()
        setCookieValue('comparison_token', comparisonToken)
      }
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
   * Core fetch function with automatic CSRF handling and retry logic
   */
  async function request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    retryCount = 0
  ): Promise<T> {
    const { method = 'GET', body, query, retry = 0, credentials = true, ...headerOptions } = options
    const isModifyingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    
    // Get request event for SSR cookie access
    const event = import.meta.server ? useRequestEvent() : undefined
    
    // For modifying requests, ensure CSRF cookie is fetched before making the request
    if (isModifyingRequest) {
      const xsrfToken = getXsrfToken(event)
      if (!xsrfToken && !csrfTokenFetched) {
        // Fetch CSRF cookie before making the request
        await nuxtApp.runWithContext(() => fetchCsrfCookie())
      }
    }
    
    const path = buildUrl(endpoint, query, headerOptions)
    const headers = buildHeaders(headerOptions, event)

    // All requests go directly to backend (both SSR and CSR)
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}${path}`

    // Auth endpoints that should not trigger auto-logout on errors
    const isAuthEndpoint = ['/login', '/register', '/logout', '/forgot-password', '/reset-password'].some(
      authPath => endpoint.startsWith(authPath) || endpoint.includes(authPath)
    )

    // Prepare request options with SSR cookie proxying
    const requestOptions: Parameters<typeof $fetch>[1] = {
      method,
      headers,
      body: body ? body : undefined,
      retry: 0, // We handle retry manually for CSRF
      // Always include credentials for cookie-based auth
      credentials: credentials ? 'include' : 'omit',
    }

    // During SSR, proxy cookies from client request to backend
    if (import.meta.server && event) {
      const requestHeaders = useRequestHeaders(['cookie'])
      if (requestHeaders.cookie) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Cookie: requestHeaders.cookie,
        }
      }
    }

    // Execute request with context preservation
    return nuxtApp.runWithContext(async () => {
      try {
        return await $fetch<T>(url, requestOptions)
      } catch (error: unknown) {
        const apiError = parseApiError(error)
        
        // Handle 419 CSRF token mismatch - retry once after fetching new CSRF cookie
        if (apiError.status === 419 && isModifyingRequest && retryCount === 0) {
          // Clear CSRF cache and fetch new token
          clearCsrfCache()
          await fetchCsrfCookie()
          
          // Retry the request once
          return request<T>(endpoint, options, retryCount + 1)
        }
        
        // Handle 401 unauthorized - auto logout (except for auth endpoints)
        if (isAuthError(apiError) && !isAuthEndpoint && import.meta.client) {
          try {
            if (nuxtApp.$pinia) {
              const authStore = useAuthStore(nuxtApp.$pinia)
              await authStore.logout()
              router.push('/auth/login' as any)
            }
          } catch (storeError) {
            console.warn('Could not access auth store for auto-logout:', storeError)
          }
        }
        
        throw apiError
      }
    })
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
    clearCsrfCache,
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

