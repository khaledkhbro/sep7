"use client"

import { useState, useEffect } from "react"
import { Globe, DollarSign, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { currencyService, type Currency, type Language } from "@/lib/currency"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface CurrencyLanguageSwitcherProps {
  variant?: "compact" | "full"
}

export function CurrencyLanguageSwitcher({ variant = "compact" }: CurrencyLanguageSwitcherProps) {
  const { user } = useAuth()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      // Load currencies
      const currenciesData = await currencyService.getCurrencies()
      setCurrencies(currenciesData)

      // Load languages (mock data for now)
      const languagesData: Language[] = [
        { id: 1, code: "en", name: "English", native_name: "English", is_default: true, is_active: true, rtl: false },
        { id: 2, code: "es", name: "Spanish", native_name: "Español", is_default: false, is_active: true, rtl: false },
        { id: 3, code: "fr", name: "French", native_name: "Français", is_default: false, is_active: true, rtl: false },
        { id: 4, code: "bn", name: "Bengali", native_name: "বাংলা", is_default: false, is_active: true, rtl: false },
        { id: 5, code: "ar", name: "Arabic", native_name: "العربية", is_default: false, is_active: true, rtl: true },
      ]
      setLanguages(languagesData)

      // Set current preferences
      if (user) {
        try {
          const userCurrency = await currencyService.getUserCurrency(user.id)
          setCurrentCurrency(userCurrency)
        } catch (error) {
          // Fallback to USD
          const usdCurrency = currenciesData.find((c) => c.code === "USD")
          setCurrentCurrency(usdCurrency || currenciesData[0])
        }
      } else {
        // Default to USD for non-logged in users
        const usdCurrency = currenciesData.find((c) => c.code === "USD")
        setCurrentCurrency(usdCurrency || currenciesData[0])
      }

      // Set default language (English)
      const defaultLanguage = languagesData.find((l) => l.is_default) || languagesData[0]
      setCurrentLanguage(defaultLanguage)
    } catch (error) {
      console.error("Error loading currency/language data:", error)
    }
  }

  const handleCurrencyChange = async (currency: Currency) => {
    if (!user) {
      // For non-logged in users, just update local state
      setCurrentCurrency(currency)
      localStorage.setItem("preferred_currency", currency.code)
      toast.success(`Currency changed to ${currency.name}`)
      return
    }

    setLoading(true)
    try {
      await currencyService.setUserCurrency(currency.code, user.id)
      setCurrentCurrency(currency)
      toast.success(`Currency changed to ${currency.name}`)
    } catch (error) {
      console.error("Error updating currency:", error)
      toast.error("Failed to update currency preference")
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (language: Language) => {
    console.log("[v0] Language change requested:", language.code, language.name)

    setCurrentLanguage(language)
    localStorage.setItem("preferred_language", language.code)

    console.log("[v0] Language preference saved to localStorage:", language.code)

    // Update document language attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = language.code
      console.log("[v0] Document language updated to:", language.code)
    }

    // Update document direction for RTL languages
    if (typeof document !== "undefined") {
      document.documentElement.dir = language.rtl ? "rtl" : "ltr"
      console.log("[v0] Document direction updated to:", language.rtl ? "rtl" : "ltr")
    }

    toast.success(`Language changed to ${language.native_name}`)
    console.log("[v0] Language change completed successfully")

    // Show info for non-English languages about translation status
    if (language.code !== "en") {
      toast.info("Full translation support coming soon!")
      console.log("[v0] Non-English language selected, showing translation notice")
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        {/* Currency Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {currentCurrency?.code || "USD"}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Currency</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currencies.map((currency) => (
              <DropdownMenuItem
                key={currency.id}
                onClick={() => handleCurrencyChange(currency)}
                className="cursor-pointer"
                disabled={loading}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{currency.code}</span>
                    <span className="text-sm">{currency.symbol}</span>
                  </div>
                  {currentCurrency?.code === currency.code && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Globe className="h-3 w-3 mr-1" />
              {currentLanguage?.code.toUpperCase() || "EN"}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.id}
                onClick={() => handleLanguageChange(language)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-sm">{language.native_name}</span>
                    <span className="text-xs text-gray-500">{language.name}</span>
                  </div>
                  {currentLanguage?.code === language.code && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Full variant for settings pages
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Currency</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-transparent">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{currentCurrency?.name || "US Dollar"}</span>
                <span className="text-gray-500">({currentCurrency?.code || "USD"})</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {currencies.map((currency) => (
              <DropdownMenuItem
                key={currency.id}
                onClick={() => handleCurrencyChange(currency)}
                className="cursor-pointer"
                disabled={loading}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{currency.code}</span>
                    <span>{currency.symbol}</span>
                    <span>{currency.name}</span>
                  </div>
                  {currentCurrency?.code === currency.code && <Badge variant="default">Current</Badge>}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Language</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-transparent">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{currentLanguage?.native_name || "English"}</span>
                <span className="text-gray-500">({currentLanguage?.name || "English"})</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.id}
                onClick={() => handleLanguageChange(language)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span>{language.native_name}</span>
                    <span className="text-sm text-gray-500">{language.name}</span>
                  </div>
                  {currentLanguage?.code === language.code && <Badge variant="default">Current</Badge>}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
