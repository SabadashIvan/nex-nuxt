/**
 * System configuration types
 */

export interface Locale {
  code: string
  name: string
  native_name?: string
  is_default?: boolean
}

export interface Currency {
  code: string
  name: string
  symbol: string
  decimal_places?: number
  is_default?: boolean
}

export interface SystemConfig {
  locales: Locale[]
  currencies: Currency[]
  default_locale: string
  default_currency: string
  min_price?: number
  max_price?: number
  features?: Record<string, boolean>
}

export interface SetLocalePayload {
  locale: string
}

export interface SetCurrencyPayload {
  currency: string
}

