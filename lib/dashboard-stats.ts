import { getAllJobs, getUserApplications } from "./jobs"
import { getWorkProofsByJob } from "./work-proofs"
import { getWallet } from "./wallet"

export interface DashboardStats {
  totalEarnings: number
  activeJobs: number
  completedJobs: number
  pendingApplications: number
}

export interface RecentActivityItem {
  id: string
  type: "job_applied" | "job_completed" | "payment_received" | "application_accepted"
  title: string
  description: string
  amount?: number
  timestamp: string
  status: "success" | "pending" | "info"
}

export async function getUserDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    console.log("[v0] Calculating real dashboard stats for user:", userId)

    // Get user's applications
    const applications = await getUserApplications(userId)
    console.log("[v0] User applications:", applications.length)

    // Get all jobs to find user's jobs
    const allJobs = await getAllJobs()
    const userJobs = allJobs.filter((job) => job.userId === userId)
    console.log("[v0] User's posted jobs:", userJobs.length)

    const wallet = await getWallet(userId)
    const totalEarnings = wallet?.earningsBalance || 0
    console.log("[v0] Total earnings from wallet:", totalEarnings)

    // Count active jobs (accepted applications that are in progress)
    const activeJobs = applications.filter((app) => app.status === "accepted").length
    console.log("[v0] Active jobs (accepted applications):", activeJobs)

    // Count completed jobs (check work proofs)
    let completedJobs = 0
    for (const app of applications.filter((app) => app.status === "accepted")) {
      const workProofs = await getWorkProofsByJob(app.jobId)
      const hasApprovedProof = workProofs.some((proof) => proof.workerId === userId && proof.status === "approved")
      if (hasApprovedProof) {
        completedJobs++
      }
    }
    console.log("[v0] Completed jobs (with approved work proofs):", completedJobs)

    // Count pending applications
    const pendingApplications = applications.filter((app) => app.status === "pending").length
    console.log("[v0] Pending applications:", pendingApplications)

    const stats = {
      totalEarnings,
      activeJobs,
      completedJobs,
      pendingApplications,
    }

    console.log("[v0] Final dashboard stats:", stats)
    return stats
  } catch (error) {
    console.error("[v0] Error calculating dashboard stats:", error)
    return {
      totalEarnings: 0,
      activeJobs: 0,
      completedJobs: 0,
      pendingApplications: 0,
    }
  }
}

export async function getUserRecentActivity(userId: string, limit = 5): Promise<RecentActivityItem[]> {
  try {
    console.log("[v0] Getting recent activity for user:", userId)

    const activities: RecentActivityItem[] = []

    // Get user's applications
    const applications = await getUserApplications(userId)

    // Add application activities
    applications.slice(0, limit).forEach((app) => {
      if (app.status === "accepted") {
        activities.push({
          id: `app_accepted_${app.id}`,
          type: "application_accepted",
          title: "Application Accepted",
          description: `Your application for "${app.job?.title || "Job"}" was accepted`,
          timestamp: app.acceptedAt || app.createdAt,
          status: "success",
        })
      } else if (app.status === "pending") {
        activities.push({
          id: `app_pending_${app.id}`,
          type: "job_applied",
          title: "Job Application Submitted",
          description: `Applied for "${app.job?.title || "Job"}"`,
          timestamp: app.createdAt,
          status: "pending",
        })
      }
    })

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    console.log("[v0] Recent activities found:", sortedActivities.length)
    return sortedActivities
  } catch (error) {
    console.error("[v0] Error getting recent activity:", error)
    return []
  }
}

export async function getUserNotifications(userId: string): Promise<
  Array<{
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    timestamp: string
    read: boolean
  }>
> {
  try {
    console.log("[v0] Getting notifications for user:", userId)

    const notifications = []

    // Get user's applications for notification generation
    const applications = await getUserApplications(userId)

    // Check for accepted applications
    const acceptedApps = applications.filter((app) => app.status === "accepted")
    acceptedApps.forEach((app) => {
      notifications.push({
        id: `notif_accepted_${app.id}`,
        title: "Application Accepted!",
        message: `Your application for "${app.job?.title || "Job"}" has been accepted. Start working now!`,
        type: "success" as const,
        timestamp: app.acceptedAt || app.createdAt,
        read: false,
      })
    })

    // Check for pending applications
    const pendingApps = applications.filter((app) => app.status === "pending")
    if (pendingApps.length > 0) {
      notifications.push({
        id: `notif_pending_${Date.now()}`,
        title: "Applications Under Review",
        message: `You have ${pendingApps.length} application(s) pending review.`,
        type: "info" as const,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    // Sort by timestamp
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10) // Limit to 10 most recent

    console.log("[v0] Notifications found:", sortedNotifications.length)
    return sortedNotifications
  } catch (error) {
    console.error("[v0] Error getting notifications:", error)
    return []
  }
}
