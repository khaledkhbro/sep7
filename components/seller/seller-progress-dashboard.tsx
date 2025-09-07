"use client"

import { SellerLevelManager } from "@/lib/seller-levels"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { SellerLevelBadge } from "./seller-level-badge"

interface SellerProgressDashboardProps {
  sellerId: string
}

export function SellerProgressDashboard({ sellerId }: SellerProgressDashboardProps) {
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize seller if not exists
    SellerLevelManager.initializeSeller(sellerId)

    const data = SellerLevelManager.getProgressToNextLevel(sellerId)
    setProgressData(data)
    setLoading(false)
  }, [sellerId])

  if (loading) {
    return <div className="animate-pulse">Loading seller progress...</div>
  }

  if (!progressData) {
    return <div>Unable to load seller progress</div>
  }

  const { currentLevel, nextLevel, progress } = progressData

  return (
    <div className="space-y-6">
      {/* Current Level Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span>Your Seller Level</span>
            <SellerLevelBadge sellerId={sellerId} size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Benefits:</h4>
              <ul className="space-y-1">
                {currentLevel.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                You can create up to <strong>{currentLevel.maxGigs} gigs</strong> at your current level.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Level */}
      {nextLevel ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Progress to {nextLevel.displayName}</span>
              <Badge
                variant="outline"
                className={`bg-${nextLevel.color}-50 text-${nextLevel.color}-700 border-${nextLevel.color}-200`}
              >
                {nextLevel.badge} {nextLevel.displayName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Bars */}
              <div className="space-y-4">
                {Object.entries(progress).map(([key, data]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-sm text-gray-600">
                        {key === "rating"
                          ? `${data.current.toFixed(1)}/${data.required}`
                          : key === "earnings"
                            ? `$${data.current}/$${data.required}`
                            : key === "accountAge"
                              ? `${data.current}/${data.required} days`
                              : `${data.current}${key.includes("Rate") ? "%" : ""}/${data.required}${key.includes("Rate") ? "%" : ""}`}
                      </span>
                    </div>
                    <Progress value={data.percentage} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Next Level Benefits */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">What you'll unlock:</h4>
                <ul className="space-y-1">
                  {nextLevel.benefits.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-500">→</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Requirements Summary:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {nextLevel.requirements.evaluationPeriod && (
                    <p>• Evaluated over the last {nextLevel.requirements.evaluationPeriod} days</p>
                  )}
                  {nextLevel.requirements.minOrders && (
                    <p>• Complete at least {nextLevel.requirements.minOrders} orders</p>
                  )}
                  {nextLevel.requirements.minEarnings && (
                    <p>• Earn at least ${nextLevel.requirements.minEarnings} total</p>
                  )}
                  {nextLevel.requirements.minRating && (
                    <p>• Maintain {nextLevel.requirements.minRating}+ star rating</p>
                  )}
                  {nextLevel.requirements.minOnTimeDelivery && (
                    <p>• Keep {nextLevel.requirements.minOnTimeDelivery}%+ on-time delivery</p>
                  )}
                  {nextLevel.requirements.minResponseRate && (
                    <p>• Maintain {nextLevel.requirements.minResponseRate}%+ response rate</p>
                  )}
                  {nextLevel.requirements.minAccountAge && (
                    <p>• Be active for at least {nextLevel.requirements.minAccountAge} days</p>
                  )}
                  <p>• Avoid policy violations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Congratulations! You've reached the highest level!
            </h3>
            <p className="text-gray-600">
              You're now a {currentLevel.displayName} with access to all platform benefits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
