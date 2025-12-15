/**
 * System Store
 * Handles global system configuration: locales, currencies, settings
 */

import { defineStore } from 'pinia'
import type { SystemConfig, Locale, Currency } from '~/types'
import { setToken, TOKEN_KEYS } from '~/utils/tokens'

interface SystemState {
  locales: Locale[]
  currencies: Currency[]
  currentLocale: string
  currentCurrency: string
  systemConfig: SystemConfig | null
  loading: boolean
  error: string | null
  initialized: boolean
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    locales: [],
    currencies: [],
    currentLocale: 'en',
    currentCurrency: 'USD',
    systemConfig: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    /**
     * Get current locale object
     */
    currentLocaleObject: (state): Locale | undefined => {
      return state.locales.find(l => l.code === state.currentLocale)
    },

    /**
     * Get current currency object
     */
    currentCurrencyObject: (state): Currency | undefined => {
      return state.currencies.find(c => c.code === state.currentCurrency)
    },

    /**
     * Get currency symbol
     */
    currencySymbol: (state): string => {
      const currency = state.currencies.find(c => c.code === state.currentCurrency)
      return currency?.symbol || state.currentCurrency
    },

    /**
     * Check if system is configured
     */
    isConfigured: (state): boolean => {
      return state.systemConfig !== null
    },
  },

  actions: {
    /**
     * Fetch system configuration from API
     */
    async fetchSystemConfig() {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const config = await api.get<SystemConfig>('/system/config')
        
        this.systemConfig = config
        this.locales = config.locales
        this.currencies = config.currencies

        // Set defaults if not already set
        if (!this.currentLocale && config.default_locale) {
          this.currentLocale = config.default_locale
        }
        if (!this.currentCurrency && config.default_currency) {
          this.currentCurrency = config.default_currency
        }
      } catch (error) {
        this.error = 'Failed to load system configuration'
        console.error('System config error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Set current locale
     */
    async setLocale(locale: string) {
      const api = useApi()
      const previousLocale = this.currentLocale

      try {
        // Optimistic update
        this.currentLocale = locale
        setToken(TOKEN_KEYS.LOCALE, locale)

        // Notify backend (optional - some backends track user preferences)
        await api.put('/system/locale', { locale })

        // Trigger reactive updates across stores
        await this.onLocaleChange()
      } catch (error) {
        // Rollback on failure
        this.currentLocale = previousLocale
        setToken(TOKEN_KEYS.LOCALE, previousLocale)
        console.error('Failed to set locale:', error)
      }
    },

    /**
     * Set current currency
     */
    async setCurrency(currency: string) {
      const api = useApi()
      const previousCurrency = this.currentCurrency

      try {
        // Optimistic update
        this.currentCurrency = currency
        setToken(TOKEN_KEYS.CURRENCY, currency)

        // Notify backend
        await api.put('/system/currency', { currency })

        // Trigger reactive updates across stores
        await this.onCurrencyChange()
      } catch (error) {
        // Rollback on failure
        this.currentCurrency = previousCurrency
        setToken(TOKEN_KEYS.CURRENCY, previousCurrency)
        console.error('Failed to set currency:', error)
      }
    },

    /**
     * Handle locale change - reload locale-dependent data
     */
    async onLocaleChange() {
      // Reload SEO metadata
      const seoStore = useSeoStore()
      const route = useRoute()
      await seoStore.fetch(route.path)
      seoStore.apply()

      // Other stores can watch currentLocale and react accordingly
    },

    /**
     * Handle currency change - reload price-dependent data
     */
    async onCurrencyChange() {
      // Reload cart totals
      const cartStore = useCartStore()
      if (cartStore.cart) {
        await cartStore.loadCart()
      }

      // Other stores can watch currentCurrency and react accordingly
    },

    /**
     * Reset store state
     */
    reset() {
      this.locales = []
      this.currencies = []
      this.currentLocale = 'en'
      this.currentCurrency = 'USD'
      this.systemConfig = null
      this.loading = false
      this.error = null
      this.initialized = false
    },
  },
})

