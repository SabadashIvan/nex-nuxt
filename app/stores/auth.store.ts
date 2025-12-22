/**
 * Auth Store
 * Handles user authentication, registration, password reset, email verification
 * Uses Laravel Sanctum session-based SPA authentication
 */

import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import type { 
  User, 
  LoginPayload, 
  RegisterPayload, 
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  EmailVerificationStatus,
  PasswordResetStatus,
} from '~/types'
import { parseApiError, getFieldErrors } from '~/utils/errors'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  fieldErrors: Record<string, string>
  emailVerificationStatus: EmailVerificationStatus
  passwordResetStatus: PasswordResetStatus
  /** Tracks if initial auth check has been done */
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
    fieldErrors: {},
    emailVerificationStatus: 'idle',
    passwordResetStatus: 'idle',
    initialized: false,
  }),

  getters: {
    /**
     * Check if user is authenticated (session-based, check user only)
     */
    isAuthenticated: (state): boolean => {
      return !!state.user
    },

    /**
     * Get user's name
     */
    userName: (state): string | null => {
      return state.user?.name || null
    },

    /**
     * Get user's email
     */
    userEmail: (state): string | null => {
      return state.user?.email || null
    },

    /**
     * Check if email is verified
     */
    isEmailVerified: (state): boolean => {
      return !!state.user?.email_verified_at
    },
  },

  actions: {
    /**
     * Clear errors
     */
    clearErrors() {
      this.error = null
      this.fieldErrors = {}
    },

    /**
     * Login user (session-based)
     * 1. Fetch CSRF cookie
     * 2. POST to /login
     * 3. Fetch user data
     */
    async login(payload: LoginPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Step 1: Get CSRF cookie
        await nuxtApp.runWithContext(async () => await api.fetchCsrfCookie())
        
        // Step 2: Login (returns 204 No Content)
        await nuxtApp.runWithContext(async () => await api.post('/login', payload))
        
        // Step 3: Fetch user data
        const user = await nuxtApp.runWithContext(async () => 
          await api.get<User>('/auth/user')
        )
        this.user = user

        // Attach guest cart to user - capture store before await
        const cartStore = useCartStore()
        await nuxtApp.runWithContext(async () => await cartStore.attachCart())

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Register new user (session-based)
     * 1. Fetch CSRF cookie
     * 2. POST to /register
     * 3. Fetch user data
     */
    async register(payload: RegisterPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Step 1: Get CSRF cookie
        await nuxtApp.runWithContext(async () => await api.fetchCsrfCookie())
        
        // Step 2: Register (returns 204 No Content)
        await nuxtApp.runWithContext(async () => await api.post('/register', payload))
        
        // Step 3: Fetch user data
        const user = await nuxtApp.runWithContext(async () => 
          await api.get<User>('/auth/user')
        )
        this.user = user

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Logout user (session-based)
     */
    async logout(): Promise<void> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()

      try {
        // Call logout endpoint if user is authenticated
        if (this.user) {
          await nuxtApp.runWithContext(async () => await api.post('/logout'))
        }
      } catch (error) {
        // Ignore errors - we're logging out anyway
        console.error('Logout error:', error)
      } finally {
        // Clear local state regardless
        this.user = null
      }
    },

    /**
     * Fetch current user (session-based)
     * Tries to get user data using existing session cookie
     */
    async fetchUser(): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      
      this.loading = true
      this.clearErrors()

      try {
        const user = await nuxtApp.runWithContext(async () => 
          await api.get<User>('/auth/user')
        )
        this.user = user
        return true
      } catch {
        // Session is invalid or expired
        this.user = null
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Request password reset email
     */
    async forgotPassword(payload: ForgotPasswordPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()
      this.passwordResetStatus = 'idle'

      try {
        // Get CSRF cookie first
        await nuxtApp.runWithContext(async () => await api.fetchCsrfCookie())
        
        const response = await nuxtApp.runWithContext(async () => 
          await api.post<ForgotPasswordResponse>('/forgot-password', payload)
        )
        this.passwordResetStatus = 'sent'
        // Response contains: { status: "We have emailed your password reset link." }
        console.log('Password reset email sent:', response.status)
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        this.passwordResetStatus = 'error'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset password with token
     */
    async resetPassword(payload: ResetPasswordPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Get CSRF cookie first
        await nuxtApp.runWithContext(async () => await api.fetchCsrfCookie())
        
        const response = await nuxtApp.runWithContext(async () => 
          await api.post<ResetPasswordResponse>('/reset-password', payload)
        )
        this.passwordResetStatus = 'reset'
        // Response contains: { status: "Your password has been reset." }
        console.log('Password reset successful:', response.status)
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        this.passwordResetStatus = 'error'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Verify email address
     * Note: This is a GET request that redirects (302) on success
     */
    async verifyEmail(id: string, hash: string): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()
      this.emailVerificationStatus = 'idle'

      try {
        await nuxtApp.runWithContext(async () => 
          await api.get(`/verify-email/${id}/${hash}`)
        )
        this.emailVerificationStatus = 'verified'
        
        // Refresh user to get updated verification status
        await this.fetchUser()
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.emailVerificationStatus = 'error'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Resend verification email
     */
    async resendVerificationEmail(): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () => 
          await api.post('/email/verification-notification')
        )
        this.emailVerificationStatus = 'sent'
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.emailVerificationStatus = 'error'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Initialize auth state from session cookie
     * Attempts to fetch user if session exists
     */
    async initialize(): Promise<void> {
      if (this.initialized) return
      
      // On client, try to fetch user to check if session is valid
      if (import.meta.client) {
        await this.fetchUser()
      }
      
      this.initialized = true
    },

    /**
     * Reset store state
     */
    reset() {
      this.user = null
      this.loading = false
      this.error = null
      this.fieldErrors = {}
      this.emailVerificationStatus = 'idle'
      this.passwordResetStatus = 'idle'
      this.initialized = false
    },
  },
})

