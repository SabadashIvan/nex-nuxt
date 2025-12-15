/**
 * Price and currency formatting utilities
 */

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  UAH: '₴',
  RUB: '₽',
  PLN: 'zł',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  CAD: 'CA$',
  AUD: 'A$',
}

// Locale map for currencies
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  UAH: 'uk-UA',
  RUB: 'ru-RU',
  PLN: 'pl-PL',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  INR: 'en-IN',
  BRL: 'pt-BR',
  CAD: 'en-CA',
  AUD: 'en-AU',
}

export interface FormatPriceOptions {
  currency?: string
  locale?: string
  showCurrency?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Format price with currency
 * Prices are stored in minor units (cents), so we divide by 100
 */
export function formatPrice(
  priceInMinorUnits: number,
  options: FormatPriceOptions = {}
): string {
  const {
    currency = 'USD',
    locale = CURRENCY_LOCALES[currency] || 'en-US',
    showCurrency = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  // Convert from minor units to major units
  const price = priceInMinorUnits / 100

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showCurrency ? 'currency' : 'decimal',
      currency: showCurrency ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    })
    return formatter.format(price)
  } catch {
    // Fallback formatting
    const symbol = showCurrency ? (CURRENCY_SYMBOLS[currency] || currency) : ''
    return `${symbol}${price.toFixed(minimumFractionDigits)}`
  }
}

/**
 * Format price without currency symbol (just the number)
 */
export function formatPriceValue(
  priceInMinorUnits: number,
  options: Omit<FormatPriceOptions, 'showCurrency'> = {}
): string {
  return formatPrice(priceInMinorUnits, { ...options, showCurrency: false })
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(originalPrice: number, effectivePrice: number): number {
  if (originalPrice <= 0 || effectivePrice >= originalPrice) return 0
  return Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
}

/**
 * Format discount percentage for display
 */
export function formatDiscountPercent(originalPrice: number, effectivePrice: number): string {
  const percent = calculateDiscountPercent(originalPrice, effectivePrice)
  return percent > 0 ? `-${percent}%` : ''
}

/**
 * Check if product has discount
 */
export function hasDiscount(originalPrice: number, effectivePrice: number): boolean {
  return effectivePrice < originalPrice
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  options: FormatPriceOptions = {}
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, options)
  }
  return `${formatPrice(minPrice, options)} - ${formatPrice(maxPrice, options)}`
}

/**
 * Parse price string to minor units
 */
export function parsePriceToMinorUnits(priceString: string): number {
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(',', '.')
  const price = parseFloat(cleaned)
  return Math.round(price * 100)
}

