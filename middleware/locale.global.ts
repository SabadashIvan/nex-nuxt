/**
 * Global locale middleware
 * Loads language and currency from cookies on SSR
 * Sets defaults if not present - store initialization handled by plugins
 */

import { getToken, TOKEN_KEYS, setToken } from '~/utils/tokens'

// Default values
const DEFAULT_LOCALE = 'en'
const DEFAULT_CURRENCY = 'USD'

export default defineNuxtRouteMiddleware(async () => {
  // Get stored preferences
  const storedLocale = getToken(TOKEN_KEYS.LOCALE)
  const storedCurrency = getToken(TOKEN_KEYS.CURRENCY)

  // Set defaults if not stored
  if (!storedLocale) {
    setToken(TOKEN_KEYS.LOCALE, DEFAULT_LOCALE)
  }
  if (!storedCurrency) {
    setToken(TOKEN_KEYS.CURRENCY, DEFAULT_CURRENCY)
  }

  // Only try to access store if Pinia is initialized
  const pinia = useNuxtApp().$pinia
  if (!pinia) {
    // Pinia not available yet - plugin will handle initialization
    return
  }

  // Try to initialize store if Pinia is available
  try {
    const { useSystemStore } = await import('~/stores/system.store')
    const systemStore = useSystemStore(pinia)
    
    // Only run initialization once
    if (!systemStore.initialized) {
      // Initialize system store with stored values or defaults
      systemStore.currentLocale = storedLocale || DEFAULT_LOCALE
      systemStore.currentCurrency = storedCurrency || DEFAULT_CURRENCY

      // Fetch system config on first load (SSR)
      if (!systemStore.systemConfig && import.meta.server) {
        try {
          await systemStore.fetchSystemConfig()
        } catch (error) {
          console.error('Failed to fetch system config:', error)
        }
      }

      systemStore.initialized = true
    }
  } catch (error) {
    // Store access failed - plugin will handle initialization
    console.warn('Could not initialize system store in middleware:', error)
  }
})

