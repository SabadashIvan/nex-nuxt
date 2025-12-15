/**
 * Proxy for Laravel forgot password endpoint
 * Routes: POST /forgot-password
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'http://localhost:8000'
  const body = await readBody(event)

  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw(`${backendUrl}/forgot-password`, {
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
      statusMessage: err.statusMessage || 'Failed to send password reset email',
      data: err.data,
    })
  }
})

