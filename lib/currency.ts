export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  is_base_currency: boolean
  is_active: boolean
  decimal_places: number
}

export interface ExchangeRate {
  id: number
  from_currency_id: number
  to_currency_id: number
  live_rate: number
  custom_rate: number | null
  use_custom_rate: boolean
  last_updated: string
}

export interface UserPreferences {
  currency_id: number
  language_id: number
  currency?: Currency
  language?: Language
}

export interface Language {
  id: number
  code: string
  name: string
  native_name: string
  is_default: boolean
  is_active: boolean
  rtl: boolean
}

const DEFAULT_CURRENCIES: Currency[] = [
  { id: 1, code: "USD", name: "US Dollar", symbol: "$", is_base_currency: true, is_active: true, decimal_places: 2 },
  { id: 2, code: "EUR", name: "Euro", symbol: "€", is_base_currency: false, is_active: true, decimal_places: 2 },
  {
    id: 3,
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    is_base_currency: false,
    is_active: true,
    decimal_places: 2,
  },
  {
    id: 4,
    code: "BDT",
    name: "Bangladeshi Taka",
    symbol: "৳",
    is_base_currency: false,
    is_active: true,
    decimal_places: 2,
  },
  {
    id: 5,
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    is_base_currency: false,
    is_active: true,
    decimal_places: 2,
  },
  {
    id: 6,
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    is_base_currency: false,
    is_active: true,
    decimal_places: 2,
  },
  {
    id: 7,
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    is_base_currency: false,
    is_active: true,
    decimal_places: 2,
  },
  {
    id: 8,
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    is_base_currency: false,
    is_active: true,
    decimal_places: 0,
  },
]

const DEFAULT_LANGUAGES: Language[] = [
  { id: 1, code: "en", name: "English", native_name: "English", is_default: true, is_active: true, rtl: false },
  { id: 2, code: "es", name: "Spanish", native_name: "Español", is_default: false, is_active: true, rtl: false },
  { id: 3, code: "fr", name: "French", native_name: "Français", is_default: false, is_active: true, rtl: false },
  { id: 4, code: "de", name: "German", native_name: "Deutsch", is_default: false, is_active: true, rtl: false },
  { id: 5, code: "bn", name: "Bengali", native_name: "বাংলা", is_default: false, is_active: true, rtl: false },
  { id: 6, code: "hi", name: "Hindi", native_name: "हिन्दी", is_default: false, is_active: true, rtl: false },
  { id: 7, code: "ar", name: "Arabic", native_name: "العربية", is_default: false, is_active: true, rtl: true },
]

export class CurrencyService {
  private static instance: CurrencyService
  private currencies: Currency[] = DEFAULT_CURRENCIES
  private languages: Language[] = DEFAULT_LANGUAGES
  private exchangeRates: Map<string, number> = new Map()
  private lastFetch = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService()
    }
    return CurrencyService.instance
  }

  // Get all active currencies
  async getCurrencies(): Promise<Currency[]> {
    return this.currencies.filter((c) => c.is_active)
  }

  // Get all active languages
  async getLanguages(): Promise<Language[]> {
    return this.languages.filter((l) => l.is_active)
  }

  // Get currency by code
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    return this.currencies.find((c) => c.code === code) || null
  }

  // Get language by code
  async getLanguageByCode(code: string): Promise<Language | null> {
    return this.languages.find((l) => l.code === code) || null
  }

  // Get base currency (USD)
  async getBaseCurrency(): Promise<Currency> {
    const baseCurrency = this.currencies.find((c) => c.is_base_currency)
    if (!baseCurrency) {
      throw new Error("Base currency not found")
    }
    return baseCurrency
  }

  // Get default language
  async getDefaultLanguage(): Promise<Language> {
    const defaultLanguage = this.languages.find((l) => l.is_default)
    if (!defaultLanguage) {
      throw new Error("Default language not found")
    }
    return defaultLanguage
  }

  private async fetchLiveRates(): Promise<void> {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
      const data = await response.json()

      if (data.rates) {
        // Store rates with USD as base
        Object.entries(data.rates).forEach(([code, rate]) => {
          this.exchangeRates.set(`USD-${code}`, rate as number)
          this.exchangeRates.set(`${code}-USD`, 1 / (rate as number))
        })

        // Calculate cross rates
        this.currencies.forEach((fromCurrency) => {
          this.currencies.forEach((toCurrency) => {
            if (fromCurrency.code !== toCurrency.code) {
              const fromRate = data.rates[fromCurrency.code] || 1
              const toRate = data.rates[toCurrency.code] || 1
              const crossRate = toRate / fromRate
              this.exchangeRates.set(`${fromCurrency.code}-${toCurrency.code}`, crossRate)
            }
          })
        })

        this.lastFetch = Date.now()
        localStorage.setItem(
          "currency_rates_cache",
          JSON.stringify({
            rates: Object.fromEntries(this.exchangeRates),
            timestamp: this.lastFetch,
          }),
        )
      }
    } catch (error) {
      console.error("[v0] Error fetching live rates:", error)
      // Load from cache if available
      this.loadCachedRates()
    }
  }

  private loadCachedRates(): void {
    try {
      const cached = localStorage.getItem("currency_rates_cache")
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          this.exchangeRates = new Map(Object.entries(rates))
          this.lastFetch = timestamp
          return
        }
      }
    } catch (error) {
      console.error("[v0] Error loading cached rates:", error)
    }

    // Fallback rates if no cache
    this.setFallbackRates()
  }

  private setFallbackRates(): void {
    const fallbackRates = {
      "USD-EUR": 0.85,
      "EUR-USD": 1.18,
      "USD-GBP": 0.73,
      "GBP-USD": 1.37,
      "USD-BDT": 110,
      "BDT-USD": 0.009,
      "USD-INR": 83,
      "INR-USD": 0.012,
      "USD-CAD": 1.35,
      "CAD-USD": 0.74,
      "USD-AUD": 1.5,
      "AUD-USD": 0.67,
      "USD-JPY": 150,
      "JPY-USD": 0.0067,
    }

    Object.entries(fallbackRates).forEach(([pair, rate]) => {
      this.exchangeRates.set(pair, rate)
    })
  }

  // Get exchange rate between two currencies
  async getExchangeRate(fromCode: string, toCode: string): Promise<number> {
    if (fromCode === toCode) return 1

    // Check for custom admin rates first
    const customRate = this.getCustomRate(fromCode, toCode)
    if (customRate !== null) {
      return customRate
    }

    // Refresh rates if cache is stale
    if (Date.now() - this.lastFetch > this.CACHE_DURATION) {
      await this.fetchLiveRates()
    }

    const key = `${fromCode}-${toCode}`
    const rate = this.exchangeRates.get(key)

    if (rate) {
      return rate
    }

    // If direct rate not found, try reverse
    const reverseKey = `${toCode}-${fromCode}`
    const reverseRate = this.exchangeRates.get(reverseKey)
    if (reverseRate) {
      return 1 / reverseRate
    }

    throw new Error(`Exchange rate not found: ${fromCode} to ${toCode}`)
  }

  private getCustomRate(fromCode: string, toCode: string): number | null {
    try {
      const customRates = localStorage.getItem("admin_custom_rates")
      if (customRates) {
        const rates = JSON.parse(customRates)
        const key = `${fromCode}-${toCode}`
        return rates[key] || null
      }
    } catch (error) {
      console.error("[v0] Error loading custom rates:", error)
    }
    return null
  }

  // Convert amount between currencies
  async convertCurrency(amount: number, fromCode: string, toCode: string): Promise<number> {
    if (fromCode === toCode) return amount

    const rate = await this.getExchangeRate(fromCode, toCode)
    return amount * rate
  }

  // Format currency amount with proper symbol and decimal places
  async formatCurrency(amount: number, currencyCode: string, locale = "en-US"): Promise<string> {
    const currency = await this.getCurrencyByCode(currencyCode)
    if (!currency) {
      return amount.toFixed(2)
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: currency.decimal_places,
        maximumFractionDigits: currency.decimal_places,
      }).format(amount)
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      return `${currency.symbol}${amount.toFixed(currency.decimal_places)}`
    }
  }

  async getUserCurrency(userId?: number): Promise<Currency> {
    try {
      const key = userId ? `user_currency_${userId}` : "guest_currency"
      const savedCode = localStorage.getItem(key)
      if (savedCode) {
        const currency = await this.getCurrencyByCode(savedCode)
        if (currency) return currency
      }
    } catch (error) {
      console.error("[v0] Error loading user currency:", error)
    }

    // Return base currency as default
    return await this.getBaseCurrency()
  }

  async getUserLanguage(userId?: number): Promise<Language> {
    try {
      const key = userId ? `user_language_${userId}` : "guest_language"
      const savedCode = localStorage.getItem(key)
      if (savedCode) {
        const language = await this.getLanguageByCode(savedCode)
        if (language) return language
      }
    } catch (error) {
      console.error("[v0] Error loading user language:", error)
    }

    // Return default language
    return await this.getDefaultLanguage()
  }

  async setUserCurrency(currencyCode: string, userId?: number): Promise<void> {
    const currency = await this.getCurrencyByCode(currencyCode)
    if (!currency) {
      throw new Error(`Currency not found: ${currencyCode}`)
    }

    const key = userId ? `user_currency_${userId}` : "guest_currency"
    localStorage.setItem(key, currencyCode)
  }

  async setUserLanguage(languageCode: string, userId?: number): Promise<void> {
    const language = await this.getLanguageByCode(languageCode)
    if (!language) {
      throw new Error(`Language not found: ${languageCode}`)
    }

    const key = userId ? `user_language_${userId}` : "guest_language"
    localStorage.setItem(key, languageCode)
  }

  async updateExchangeRate(
    fromCode: string,
    toCode: string,
    customRate: number | null,
    useCustom: boolean,
  ): Promise<void> {
    try {
      const customRates = JSON.parse(localStorage.getItem("admin_custom_rates") || "{}")
      const key = `${fromCode}-${toCode}`

      if (useCustom && customRate !== null) {
        customRates[key] = customRate
        // Also store reverse rate
        customRates[`${toCode}-${fromCode}`] = 1 / customRate
      } else {
        delete customRates[key]
        delete customRates[`${toCode}-${fromCode}`]
      }

      localStorage.setItem("admin_custom_rates", JSON.stringify(customRates))
    } catch (error) {
      throw new Error(`Failed to update exchange rate: ${error}`)
    }
  }

  async updateLiveRates(): Promise<void> {
    console.log("[v0] Updating live exchange rates...")
    await this.fetchLiveRates()
  }

  async getAllExchangeRates(): Promise<(ExchangeRate & { from_currency: Currency; to_currency: Currency })[]> {
    const rates: (ExchangeRate & { from_currency: Currency; to_currency: Currency })[] = []

    // Ensure we have fresh rates
    if (Date.now() - this.lastFetch > this.CACHE_DURATION) {
      await this.fetchLiveRates()
    }

    const customRates = JSON.parse(localStorage.getItem("admin_custom_rates") || "{}")

    let id = 1
    this.currencies.forEach((fromCurrency) => {
      this.currencies.forEach((toCurrency) => {
        if (fromCurrency.code !== toCurrency.code) {
          const key = `${fromCurrency.code}-${toCurrency.code}`
          const liveRate = this.exchangeRates.get(key) || 1
          const customRate = customRates[key] || null

          rates.push({
            id: id++,
            from_currency_id: fromCurrency.id,
            to_currency_id: toCurrency.id,
            live_rate: liveRate,
            custom_rate: customRate,
            use_custom_rate: customRate !== null,
            last_updated: new Date().toISOString(),
            from_currency: fromCurrency,
            to_currency: toCurrency,
          })
        }
      })
    })

    return rates
  }
}

export const currencyService = CurrencyService.getInstance()

// Helper function to convert and format currency in one call
export async function convertAndFormat(
  amount: number,
  fromCode: string,
  toCode: string,
  locale = "en-US",
): Promise<string> {
  const convertedAmount = await currencyService.convertCurrency(amount, fromCode, toCode)
  return await currencyService.formatCurrency(convertedAmount, toCode, locale)
}

export async function formatUserCurrency(amount: number, userId?: number): Promise<string> {
  const userCurrency = await currencyService.getUserCurrency(userId)
  const convertedAmount = await currencyService.convertCurrency(amount, "USD", userCurrency.code)
  return await currencyService.formatCurrency(convertedAmount, userCurrency.code)
}
