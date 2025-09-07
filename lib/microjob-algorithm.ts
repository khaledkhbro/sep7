export type MicrojobAlgorithmType = "newest_first" | "time_rotation"

export interface MicrojobAlgorithmSettings {
  id: number
  algorithm_type: MicrojobAlgorithmType
  is_enabled: boolean
  rotation_hours: number
  created_at: string
  updated_at: string
}

export interface MicrojobRotationTracking {
  id: number
  job_id: number
  last_front_page_at: string
  front_page_duration_minutes: number
  rotation_cycle: number
  created_at: string
  updated_at: string
}

// Get current algorithm settings
export async function getMicrojobAlgorithmSettings(): Promise<MicrojobAlgorithmSettings> {
  try {
    const response = await fetch("/api/admin/microjob-algorithm")
    if (!response.ok) {
      throw new Error("Failed to fetch algorithm settings")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching microjob algorithm settings:", error)
    // Return default settings if API fails
    return {
      id: 1,
      algorithm_type: "newest_first",
      is_enabled: true,
      rotation_hours: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

// Update algorithm settings
export async function updateMicrojobAlgorithmSettings(
  settings: Partial<MicrojobAlgorithmSettings>,
): Promise<MicrojobAlgorithmSettings> {
  const response = await fetch("/api/admin/microjob-algorithm", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  })

  if (!response.ok) {
    throw new Error("Failed to update algorithm settings")
  }

  return await response.json()
}

// Get rotation tracking data for admin dashboard
export async function getMicrojobRotationStats(): Promise<{
  totalJobs: number
  averageFrontPageTime: number
  currentCycle: number
  nextRotationIn: number
}> {
  try {
    const response = await fetch("/api/admin/microjob-algorithm/stats")
    if (!response.ok) {
      throw new Error("Failed to fetch rotation stats")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching rotation stats:", error)
    return {
      totalJobs: 0,
      averageFrontPageTime: 0,
      currentCycle: 1,
      nextRotationIn: 0,
    }
  }
}

// Apply algorithm to job list
export function applyMicrojobAlgorithm(
  jobs: any[],
  settings: MicrojobAlgorithmSettings,
  rotationData?: MicrojobRotationTracking[],
): any[] {
  if (!settings.is_enabled) {
    return jobs
  }

  switch (settings.algorithm_type) {
    case "newest_first":
      return jobs.sort((a, b) => {
        // First priority: newly posted jobs
        const aCreated = new Date(a.created_at || a.createdAt).getTime()
        const bCreated = new Date(b.created_at || b.createdAt).getTime()

        // Second priority: recently updated jobs (worker updates)
        const aUpdated = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt).getTime()
        const bUpdated = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt).getTime()

        // Combine both factors - newer posts and updates get priority
        const aScore = Math.max(aCreated, aUpdated)
        const bScore = Math.max(bCreated, bUpdated)

        return bScore - aScore
      })

    case "time_rotation":
      if (!rotationData) return jobs

      const rotationMap = new Map(rotationData.map((r) => [r.job_id, r]))
      const rotationHours = settings.rotation_hours
      const rotationMs = rotationHours * 60 * 60 * 1000
      const now = Date.now()

      return jobs.sort((a, b) => {
        const aRotation = rotationMap.get(a.id)
        const bRotation = rotationMap.get(b.id)

        const aLastFrontPage = aRotation ? new Date(aRotation.last_front_page_at).getTime() : 0
        const bLastFrontPage = bRotation ? new Date(bRotation.last_front_page_at).getTime() : 0

        // Calculate time since last front page appearance
        const aTimeSince = now - aLastFrontPage
        const bTimeSince = now - bLastFrontPage

        // Jobs that haven't been on front page recently get priority
        return bTimeSince - aTimeSince
      })

    default:
      return jobs
  }
}
