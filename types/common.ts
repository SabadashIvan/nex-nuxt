/**
 * Common types used across the application
 */

// API Error response structure
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

// Pagination state for stores
export interface Pagination {
  page: number
  perPage: number
  total: number
  lastPage: number
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Loading state helper
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Status types
export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error'

