export interface CommissionSettings {
  id: string
  feeType: string
  feePercentage: number
  feeFixed: number
  minimumFee: number
  maximumFee?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SupportPricingSettings {
  id: string
  supportType: string
  price: number
  responseTimeHours: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getCommissionSettings(): Promise<CommissionSettings[]> {
  try {
    const response = await fetch("/api/admin/commission")
    if (!response.ok) {
      throw new Error("Failed to fetch commission settings")
    }
    const data = await response.json()
    return data.feeSettings || []
  } catch (error) {
    console.error("Error fetching commission settings:", error)
    throw error
  }
}

export async function updateCommissionSettings(
  feeType: string,
  settings: Partial<CommissionSettings>,
): Promise<CommissionSettings> {
  try {
    const response = await fetch("/api/admin/commission", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feeType, settings }),
    })

    if (!response.ok) {
      throw new Error("Failed to update commission settings")
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error updating commission settings:", error)
    throw error
  }
}

export async function getSupportPricingSettings(): Promise<SupportPricingSettings[]> {
  try {
    const response = await fetch("/api/admin/support-pricing")
    if (!response.ok) {
      throw new Error("Failed to fetch support pricing settings")
    }
    const data = await response.json()
    return data.supportPricing || []
  } catch (error) {
    console.error("Error fetching support pricing settings:", error)
    throw error
  }
}

export async function updateSupportPricingSettings(
  supportType: string,
  settings: Partial<SupportPricingSettings>,
): Promise<SupportPricingSettings> {
  try {
    const response = await fetch("/api/admin/support-pricing", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ supportType, settings }),
    })

    if (!response.ok) {
      throw new Error("Failed to update support pricing settings")
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error updating support pricing settings:", error)
    throw error
  }
}

export function calculateChatTransferCommission(
  amount: number,
  commissionSettings: CommissionSettings,
): { commissionAmount: number; netAmount: number } {
  if (!commissionSettings.isActive) {
    return { commissionAmount: 0, netAmount: amount }
  }

  let commissionAmount = 0

  // Calculate percentage fee
  if (commissionSettings.feePercentage > 0) {
    commissionAmount += (amount * commissionSettings.feePercentage) / 100
  }

  // Add fixed fee
  if (commissionSettings.feeFixed > 0) {
    commissionAmount += commissionSettings.feeFixed
  }

  // Apply minimum fee
  if (commissionAmount < commissionSettings.minimumFee) {
    commissionAmount = commissionSettings.minimumFee
  }

  // Apply maximum fee if set
  if (commissionSettings.maximumFee && commissionAmount > commissionSettings.maximumFee) {
    commissionAmount = commissionSettings.maximumFee
  }

  const netAmount = amount - commissionAmount

  return { commissionAmount, netAmount }
}
