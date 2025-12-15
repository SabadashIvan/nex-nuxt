/**
 * Proxy for Laravel email verification endpoint
 * Routes: GET /verify-email/{id}/{hash}
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'http://localhost:8000'
  
  // Get the full path after /verify-email/
  const path = getRouterParam(event, 'path')

  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw(`${backendUrl}/verify-email/${path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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

    setResponseStatus(event, response.status)
    return response._data || {}
  } catch (error: unknown) {
    const err = error as { status?: number; data?: unknown; statusMessage?: string }
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.statusMessage || 'Email verification failed',
      data: err.data,
    })
  }
})

