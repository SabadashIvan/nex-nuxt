/**
 * Locale and currency composable for reactive formatting
 */

import { computed } from 'vue'
import { formatPrice, formatPriceRange, getCurrencySymbol, type FormatPriceOptions } from '~/utils/price'
import { formatDate, formatDateTime, formatRelativeTime, formatNumber } from '~/utils/format'
import { useSystemStore } from '~/stores/system.store'

/**
 * Composable for locale-aware formatting
 */
export function useLocaleCurrency() {
  // Get system store for current locale/currency
  const systemStore = useSystemStore()

  // Current values
  const currentLocale = computed(() => systemStore.currentLocale)
  const currentCurrency = computed(() => systemStore.currentCurrency)
  const currencySymbol = computed(() => getCurrencySymbol(systemStore.currentCurrency))

  // Available options
  const availableLocales = computed(() => systemStore.locales)
  const availableCurrencies = computed(() => systemStore.currencies)

  /**
   * Format price with current currency
   */
  function price(
    priceInMinorUnits: number, 
    options?: Omit<FormatPriceOptions, 'currency'>
  ): string {
    return formatPrice(priceInMinorUnits, {
      ...options,
      currency: currentCurrency.value,
    })
  }

  /**
   * Format price range with current currency
   */
  function priceRange(
    minPrice: number, 
    maxPrice: number
  ): string {
    return formatPriceRange(minPrice, maxPrice, {
      currency: currentCurrency.value,
    })
  }

  /**
   * Format date with current locale
   */
  function date(
    dateValue: string | Date, 
    options?: Intl.DateTimeFormatOptions
  ): string {
    return formatDate(dateValue, options, currentLocale.value)
  }

  /**
   * Format date with time using current locale
   */
  function dateTime(dateValue: string | Date): string {
    return formatDateTime(dateValue, currentLocale.value)
  }

  /**
   * Format relative time with current locale
   */
  function relativeTime(dateValue: string | Date): string {
    return formatRelativeTime(dateValue, currentLocale.value)
  }

  /**
   * Format number with current locale
   */
  function number(value: number): string {
    return formatNumber(value, currentLocale.value)
  }

  /**
   * Set locale
   */
  async function setLocale(locale: string) {
    await systemStore.setLocale(locale)
  }

  /**
   * Set currency
   */
  async function setCurrency(currency: string) {
    await systemStore.setCurrency(currency)
  }

  return {
    // Current values
    currentLocale,
    currentCurrency,
    currencySymbol,
    
    // Available options
    availableLocales,
    availableCurrencies,
    
    // Formatters
    price,
    priceRange,
    date,
    dateTime,
    relativeTime,
    number,
    
    // Setters
    setLocale,
    setCurrency,
  }
}

