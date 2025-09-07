export interface PlatformFeeSettings {
  id: string
  enabled: boolean
  percentage: number
  fixed_fee: number
  minimum_fee: number
  maximum_fee: number
  created_at: string
  updated_at: string
}

export async function getPlatformFeeSettings(): Promise<PlatformFeeSettings | null> {
  try {
    const response = await fetch("/api/admin/platform-fee")

    if (!response.ok) {
      console.error("Platform fee API returned error:", response.status, response.statusText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Platform fee API returned non-JSON response:", contentType)
      throw new Error("API returned non-JSON response")
    }

    const data = await response.json()
    return data.settings || null
  } catch (error) {
    console.error("Error fetching platform fee settings:", error)
    return {
      id: "default",
      enabled: true,
      percentage: 5.0,
      fixed_fee: 0.0,
      minimum_fee: 0.0,
      maximum_fee: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function updatePlatformFeeSettings(settings: Partial<PlatformFeeSettings>): Promise<PlatformFeeSettings> {
  try {
    const requestBody = {
      isActive: settings.enabled,
      feePercentage: settings.percentage,
      feeFixed: settings.fixed_fee,
      minimumFee: settings.minimum_fee,
      maximumFee: settings.maximum_fee,
    }

    const response = await fetch("/api/admin/platform-fee", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to update platform fee settings")
    }

    const data = await response.json()
    return data.settings
  } catch (error) {
    console.error("Error updating platform fee settings:", error)
    throw error
  }
}

export function calculatePlatformFee(
  amount: number,
  feeSettings: PlatformFeeSettings,
): { platformFee: number; netAmount: number } {
  if (!feeSettings.enabled) {
    return { platformFee: 0, netAmount: amount }
  }

  let platformFee = 0

  // Calculate percentage fee
  if (feeSettings.percentage > 0) {
    platformFee += (amount * feeSettings.percentage) / 100
  }

  // Add fixed fee
  if (feeSettings.fixed_fee > 0) {
    platformFee += feeSettings.fixed_fee
  }

  // Apply minimum fee
  if (platformFee < feeSettings.minimum_fee) {
    platformFee = feeSettings.minimum_fee
  }

  // Apply maximum fee if set
  if (feeSettings.maximum_fee && platformFee > feeSettings.maximum_fee) {
    platformFee = feeSettings.maximum_fee
  }

  // Round to 2 decimal places
  platformFee = Math.round(platformFee * 100) / 100
  const netAmount = Math.round((amount - platformFee) * 100) / 100

  return { platformFee, netAmount }
}
