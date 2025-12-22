/**
 * Centralized error handling utilities
 */

import type { ApiError } from '~/types'

// Error codes mapping
export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
} as const

// Custom error messages
export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'You are not authenticated. Please log in.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  422: 'Validation failed. Please check your input.',
  500: 'An unexpected error occurred. Please try again later.',
}

// Checkout-specific errors
export const CHECKOUT_ERRORS = {
  CART_CHANGED: 'CART_CHANGED',
  INVALID_SHIPPING: 'INVALID_SHIPPING',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const

/**
 * Parse API error response into a structured format
 */
export function parseApiError(error: unknown): ApiError {
  // Handle fetch errors
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    }
  }

  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    
    // Check for standard API error format
    if ('data' in err && typeof err.data === 'object' && err.data !== null) {
      const data = err.data as Record<string, unknown>
      return {
        message: (data.message as string) || ERROR_MESSAGES[500],
        errors: data.errors as Record<string, string[]> | undefined,
        status: (err.status as number) || (data.status as number) || 500,
      }
    }

    // Direct error object
    return {
      message: (err.message as string) || ERROR_MESSAGES[500],
      errors: err.errors as Record<string, string[]> | undefined,
      status: (err.status as number) || 500,
    }
  }

  return {
    message: ERROR_MESSAGES[500],
    status: 500,
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ApiError | unknown): string {
  const parsed = error && typeof error === 'object' && 'message' in error 
    ? error as ApiError 
    : parseApiError(error)
  
  return parsed.message || ERROR_MESSAGES[parsed.status] || ERROR_MESSAGES[500]
}

/**
 * Get field-specific validation errors
 */
export function getFieldErrors(error: ApiError): Record<string, string> {
  if (!error.errors) return {}
  
  const fieldErrors: Record<string, string> = {}
  for (const [field, messages] of Object.entries(error.errors)) {
    fieldErrors[field] = messages[0] || ''
  }
  return fieldErrors
}

/**
 * Check if error is a validation error (422)
 */
export function isValidationError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error 
    ? error as ApiError 
    : parseApiError(error)
  return parsed.status === ERROR_CODES.VALIDATION_ERROR
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error 
    ? error as ApiError 
    : parseApiError(error)
  return parsed.status === ERROR_CODES.UNAUTHORIZED
}

/**
 * Check if error is a checkout-specific error
 */
export function isCheckoutError(error: ApiError): boolean {
  const checkoutErrorMessages = Object.values(CHECKOUT_ERRORS)
  return checkoutErrorMessages.some(code => 
    error.message?.includes(code) || 
    (error.errors && Object.keys(error.errors).some(key => key.includes(code)))
  )
}

/**
 * Create a typed API error for throwing
 */
export function createApiError(status: number, message?: string, errors?: Record<string, string[]>): ApiError {
  return {
    status,
    message: message || ERROR_MESSAGES[status] || ERROR_MESSAGES[500],
    errors,
  }
}

