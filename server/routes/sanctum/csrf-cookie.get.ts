/**
 * Proxy for Laravel Sanctum CSRF cookie endpoint
 * Routes: GET /sanctum/csrf-cookie
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'https://api.nexora-room15.store'
  
  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw(`${backendUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': cookies,
      },
    })

    // Forward Set-Cookie headers from backend to client
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        appendResponseHeader(event, 'Set-Cookie', cookie)
      }
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error as { status?: number; statusMessage?: string }
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.statusMessage || 'Failed to fetch CSRF cookie',
    })
  }
})

