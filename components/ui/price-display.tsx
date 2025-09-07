"use client"

import { useState, useEffect } from "react"
import { currencyService } from "@/lib/currency"
import { useAuth } from "@/contexts/auth-context"

interface PriceDisplayProps {
  amount: number
  fromCurrency?: string
  className?: string
  showOriginal?: boolean
}

export function PriceDisplay({
  amount,
  fromCurrency = "USD",
  className = "",
  showOriginal = false,
}: PriceDisplayProps) {
  const { user } = useAuth()
  const [displayPrice, setDisplayPrice] = useState<string>("")
  const [originalPrice, setOriginalPrice] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    formatPrice()
  }, [amount, fromCurrency, user])

  const formatPrice = async () => {
    try {
      setLoading(true)

      // Get user's preferred currency or fallback to localStorage/USD
      let targetCurrency = "USD"

      if (user) {
        try {
          const userCurrency = await currencyService.getUserCurrency(user.id)
          targetCurrency = userCurrency.code
        } catch (error) {
          // Fallback to USD if user currency fetch fails
          targetCurrency = "USD"
        }
      } else {
        // For non-logged users, check localStorage
        const savedCurrency = localStorage.getItem("preferred_currency")
        if (savedCurrency) {
          targetCurrency = savedCurrency
        }
      }

      // Convert and format the price
      const convertedAmount = await currencyService.convertCurrency(amount, fromCurrency, targetCurrency)
      const formattedPrice = await currencyService.formatCurrency(convertedAmount, targetCurrency)
      setDisplayPrice(formattedPrice)

      // Format original price if needed
      if (showOriginal && fromCurrency !== targetCurrency) {
        const originalFormatted = await currencyService.formatCurrency(amount, fromCurrency)
        setOriginalPrice(originalFormatted)
      }
    } catch (error) {
      console.error("Error formatting price:", error)
      // Fallback to simple USD formatting
      setDisplayPrice(`$${amount.toFixed(2)}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <span className={`animate-pulse bg-gray-200 rounded ${className}`}>$---.--</span>
  }

  return (
    <span className={className}>
      {displayPrice}
      {showOriginal && originalPrice && originalPrice !== displayPrice && (
        <span className="text-xs text-gray-500 ml-1">({originalPrice})</span>
      )}
    </span>
  )
}

// Specialized components for different contexts
export function ServicePrice({ amount, className = "" }: { amount: number; className?: string }) {
  return <PriceDisplay amount={amount} className={`font-bold text-green-600 ${className}`} />
}

export function WalletBalance({ amount, className = "" }: { amount: number; className?: string }) {
  return <PriceDisplay amount={amount} className={`font-bold ${className}`} />
}

export function TransactionAmount({
  amount,
  showSign = true,
  className = "",
}: {
  amount: number
  showSign?: boolean
  className?: string
}) {
  const baseClass = amount > 0 ? "text-green-600" : "text-red-600"
  const sign = showSign ? (amount > 0 ? "+" : "") : ""

  return <PriceDisplay amount={Math.abs(amount)} className={`font-semibold ${baseClass} ${className}`} />
}
