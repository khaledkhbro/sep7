"use client"

import { SellerLevelManager } from "@/lib/seller-levels"
import { useEffect, useState } from "react"

interface SellerLevelBadgeProps {
  sellerId: string
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

export function SellerLevelBadge({ sellerId, showName = true, size = "md" }: SellerLevelBadgeProps) {
  const [levelInfo, setLevelInfo] = useState<any>(null)

  useEffect(() => {
    const levelId = SellerLevelManager.getSellerLevel(sellerId)
    const info = SellerLevelManager.getLevelInfo(levelId)
    setLevelInfo(info)
  }, [sellerId])

  if (!levelInfo) return null

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }

  const colorClasses = {
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses[levelInfo.color as keyof typeof colorClasses]}`}
    >
      {levelInfo.badge && <span>{levelInfo.badge}</span>}
      {showName && <span>{levelInfo.displayName}</span>}
    </div>
  )
}
