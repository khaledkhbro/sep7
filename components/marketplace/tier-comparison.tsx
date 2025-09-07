"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, RefreshCw } from "lucide-react"

interface ServiceTier {
  name: string
  price: number
  deliveryTime: string
  revisions: string
  features: string[]
  description?: string
}

interface ServiceAddOn {
  id: string
  name: string
  description: string
  price: number
  deliveryTime?: string
}

interface TierComparisonProps {
  serviceTiers: ServiceTier[]
  serviceAddOns: ServiceAddOn[]
  onTierSelect?: (tier: ServiceTier) => void
  selectedTier?: ServiceTier | null
}

export function TierComparison({ serviceTiers, serviceAddOns, onTierSelect, selectedTier }: TierComparisonProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Load visibility state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tier-comparison-visible")
    setIsVisible(saved === "true")
  }, [])

  // Save visibility state to localStorage
  const toggleVisibility = () => {
    const newState = !isVisible
    setIsVisible(newState)
    localStorage.setItem("tier-comparison-visible", newState.toString())
  }

  // Only show if there are 2 or 3 tiers
  if (serviceTiers.length < 2 || serviceTiers.length > 3) {
    return null
  }

  // Get all unique features across all tiers
  const allFeatures = Array.from(new Set(serviceTiers.flatMap((tier) => tier.features)))

  // Common comparison rows
  const comparisonRows = [
    { label: "Delivery Time", key: "deliveryTime", icon: Clock },
    { label: "Number of Revisions", key: "revisions", icon: RefreshCw },
    ...allFeatures.map((feature) => ({ label: feature, key: feature, icon: null })),
  ]

  const hasFeature = (tier: ServiceTier, feature: string) => {
    if (feature === "deliveryTime") return tier.deliveryTime
    if (feature === "revisions") return tier.revisions
    return tier.features.includes(feature)
  }

  if (!isVisible) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compare Service Tiers</h3>
              <p className="text-sm text-gray-600">See detailed comparison of all available packages</p>
            </div>
            <Button onClick={toggleVisibility} variant="outline">
              Compare Tiers
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Service Tiers Comparison</CardTitle>
          <Button onClick={toggleVisibility} variant="ghost" size="sm">
            Hide Comparison
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b font-medium text-gray-600 bg-gray-50">Service Tiers</th>
                {serviceTiers.map((tier) => (
                  <th key={tier.name} className="text-center p-4 border-b bg-gray-50 min-w-[200px]">
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-900">{tier.name}</div>
                      <div className="text-2xl font-bold text-green-600">${tier.price}</div>
                      {tier.description && (
                        <div className="text-xs text-gray-600 uppercase tracking-wide">{tier.description}</div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr key={row.key} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4 border-b font-medium text-gray-900">
                    <div className="flex items-center">
                      {row.icon && <row.icon className="mr-2 h-4 w-4 text-gray-400" />}
                      {row.label}
                    </div>
                  </td>
                  {serviceTiers.map((tier) => {
                    const value = hasFeature(tier, row.key)
                    return (
                      <td key={`${tier.name}-${row.key}`} className="p-4 border-b text-center">
                        {row.key === "deliveryTime" || row.key === "revisions" ? (
                          <span className="font-medium text-gray-900">{value}</span>
                        ) : value ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {serviceAddOns.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Optional add-ons</h4>
            <p className="text-sm text-gray-600 mb-4">You can add these on the next page.</p>
            <div className="space-y-3">
              {serviceAddOns.map((addOn) => (
                <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{addOn.name}</div>
                    <div className="text-sm text-gray-600">{addOn.description}</div>
                    {addOn.deliveryTime && <div className="text-xs text-gray-500 mt-1">+{addOn.deliveryTime}</div>}
                  </div>
                  <div className="text-lg font-semibold text-green-600">+${addOn.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          {serviceTiers.map((tier) => (
            <Button
              key={tier.name}
              onClick={() => onTierSelect?.(tier)}
              variant={selectedTier?.name === tier.name ? "default" : "outline"}
              className="min-w-[120px]"
            >
              Select {tier.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
