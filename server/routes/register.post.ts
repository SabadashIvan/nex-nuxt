/**
 * Proxy for Laravel Sanctum register endpoint
 * Routes: POST /register
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'http://localhost:8000'
  const body = await readBody(event)

  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw(`${backendUrl}/register`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies,
        'X-XSRF-TOKEN': getCookie(event, 'XSRF-TOKEN') || '',
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
      statusMessage: err.statusMessage || 'Registration failed',
      data: err.data,
    })
  }
})

