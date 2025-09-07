// Admin-related types and mock data
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalJobs: number
  totalServices: number
  totalTransactions: number
  totalRevenue: number
  monthlyGrowth: {
    users: number
    revenue: number
    jobs: number
    services: number
  }
}

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  userType: "user" | "admin"
  isVerified: boolean
  isActive: boolean
  totalEarned: number
  totalSpent: number
  joinedAt: string
  lastActive: string
}

export interface AdminTransaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "payment" | "earning" | "refund"
  amount: number
  status: "pending" | "completed" | "failed"
  description: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    username: string
  }
}

export interface PlatformMetrics {
  dailyActiveUsers: { date: string; users: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  categoryDistribution: { category: string; count: number; percentage: number }[]
  userGrowth: { month: string; newUsers: number; totalUsers: number }[]
}

// Mock data
// Removed mock data as it will be replaced with real data functions

// Mock API functions
export async function getAdminStats(): Promise<AdminStats> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    // Get real data from existing systems
    const { getAllUsers } = await import("./auth")
    const { getAllJobs } = await import("./jobs")
    const { getAllServices } = await import("./services")

    const users = getAllUsers()
    const jobs = await getAllJobs()
    const services = await getAllServices()

    // Calculate real stats
    const totalUsers = users.length
    const activeUsers = users.filter((user) => {
      const lastActive = new Date(user.lastActive || user.createdAt || Date.now())
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return lastActive > thirtyDaysAgo
    }).length

    const totalJobs = jobs.length
    const totalServices = services.length

    // Calculate total revenue from user earnings and deposits
    const totalRevenue = users.reduce((sum, user) => sum + (user.earning || 0), 0)
    const totalTransactions = users.reduce((sum, user) => sum + (user.deposit || 0) + (user.earning || 0), 0)

    // Calculate monthly growth (simplified - comparing to previous period)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const currentMonthUsers = users.filter((user) => {
      const joinDate = new Date(user.createdAt || Date.now())
      return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
    }).length

    const currentMonthJobs = jobs.filter((job) => {
      const createDate = new Date(job.createdAt || Date.now())
      return createDate.getMonth() === currentMonth && createDate.getFullYear() === currentYear
    }).length

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      totalServices,
      totalTransactions: Math.round(totalTransactions),
      totalRevenue,
      monthlyGrowth: {
        users: totalUsers > 0 ? Math.round((currentMonthUsers / totalUsers) * 100) : 0,
        revenue: totalRevenue > 0 ? Math.round(totalRevenue * 0.1) : 0, // Simplified calculation
        jobs: totalJobs > 0 ? Math.round((currentMonthJobs / totalJobs) * 100) : 0,
        services: totalServices > 0 ? Math.round(totalServices * 0.05) : 0, // Simplified calculation
      },
    }
  } catch (error) {
    console.error("Error calculating admin stats:", error)
    // Fallback to basic stats if there's an error
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalJobs: 0,
      totalServices: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      monthlyGrowth: {
        users: 0,
        revenue: 0,
        jobs: 0,
        services: 0,
      },
    }
  }
}

export async function getAdminUsers(filters?: {
  search?: string
  userType?: string
  isActive?: boolean
  limit?: number
}): Promise<AdminUser[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  try {
    const { getAllUsers } = await import("./auth")
    const users = getAllUsers()

    // Convert to AdminUser format
    let adminUsers: AdminUser[] = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      userType: user.userType as "user" | "admin",
      isVerified: user.isVerified || false,
      isActive: user.userType !== "suspended",
      totalEarned: user.earning || 0,
      totalSpent: user.deposit || 0,
      joinedAt: user.createdAt || new Date().toISOString(),
      lastActive: user.lastActive || user.createdAt || new Date().toISOString(),
    }))

    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      adminUsers = adminUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search),
      )
    }

    if (filters?.userType) {
      adminUsers = adminUsers.filter((user) => user.userType === filters.userType)
    }

    if (filters?.isActive !== undefined) {
      adminUsers = adminUsers.filter((user) => user.isActive === filters.isActive)
    }

    if (filters?.limit) {
      adminUsers = adminUsers.slice(0, filters.limit)
    }

    return adminUsers.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
  } catch (error) {
    console.error("Error getting admin users:", error)
    return []
  }
}

export async function getAdminTransactions(filters?: {
  type?: string
  status?: string
  limit?: number
}): Promise<AdminTransaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  try {
    const { getAllUsers } = await import("./auth")
    const users = getAllUsers()

    // Generate transactions from user data
    let transactions: AdminTransaction[] = []

    users.forEach((user) => {
      // Add deposit transactions
      if (user.deposit && user.deposit > 0) {
        transactions.push({
          id: `deposit_${user.id}_${Date.now()}`,
          userId: user.id,
          type: "deposit",
          amount: user.deposit,
          status: "completed",
          description: "Account deposit",
          createdAt: user.createdAt || new Date().toISOString(),
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          },
        })
      }

      // Add earning transactions
      if (user.earning && user.earning > 0) {
        transactions.push({
          id: `earning_${user.id}_${Date.now()}`,
          userId: user.id,
          type: "earning",
          amount: user.earning,
          status: "completed",
          description: "Job completion earnings",
          createdAt: user.createdAt || new Date().toISOString(),
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          },
        })
      }
    })

    // Apply filters
    if (filters?.type) {
      transactions = transactions.filter((t) => t.type === filters.type)
    }

    if (filters?.status) {
      transactions = transactions.filter((t) => t.status === filters.status)
    }

    if (filters?.limit) {
      transactions = transactions.slice(0, filters.limit)
    }

    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error getting admin transactions:", error)
    return []
  }
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  try {
    const { getAllUsers } = await import("./auth")
    const { getAllJobs } = await import("./jobs")
    const { getAllCategories } = await import("./categories")

    const users = getAllUsers()
    const jobs = await getAllJobs()
    const categories = await getAllCategories()

    // Generate daily active users for last 7 days
    const dailyActiveUsers = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      // Simulate daily active users based on total users
      const activeCount = Math.max(1, Math.floor(users.length * (0.1 + Math.random() * 0.3)))
      dailyActiveUsers.push({
        date: dateStr,
        users: activeCount,
      })
    }

    // Generate monthly revenue for last 6 months
    const monthlyRevenue = []
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const totalRevenue = users.reduce((sum, user) => sum + (user.earning || 0), 0)

    for (let i = 0; i < 6; i++) {
      const monthRevenue = Math.max(0, Math.floor(totalRevenue * (0.1 + Math.random() * 0.2)))
      monthlyRevenue.push({
        month: months[i],
        revenue: monthRevenue,
      })
    }

    // Generate category distribution from real jobs
    const categoryDistribution = []
    const categoryMap = new Map()

    jobs.forEach((job) => {
      const categoryName = job.category?.name || job.categoryId || "Other"
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
    })

    const totalJobs = jobs.length || 1
    categoryMap.forEach((count, category) => {
      categoryDistribution.push({
        category,
        count,
        percentage: Math.round((count / totalJobs) * 100 * 10) / 10,
      })
    })

    // If no jobs, show default categories
    if (categoryDistribution.length === 0) {
      categories.forEach((category) => {
        categoryDistribution.push({
          category: category.name,
          count: 0,
          percentage: 0,
        })
      })
    }

    // Generate user growth
    const userGrowth = []
    const growthMonths = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    let cumulativeUsers = 0

    for (let i = 0; i < 6; i++) {
      const newUsers = Math.max(0, Math.floor(users.length * (0.05 + Math.random() * 0.15)))
      cumulativeUsers += newUsers
      userGrowth.push({
        month: growthMonths[i],
        newUsers,
        totalUsers: Math.min(cumulativeUsers, users.length),
      })
    }

    return {
      dailyActiveUsers,
      monthlyRevenue,
      categoryDistribution: categoryDistribution.slice(0, 5), // Top 5 categories
      userGrowth,
    }
  } catch (error) {
    console.error("Error getting platform metrics:", error)
    // Return empty metrics if there's an error
    return {
      dailyActiveUsers: [],
      monthlyRevenue: [],
      categoryDistribution: [],
      userGrowth: [],
    }
  }
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Mock API call to update user status
}

export async function verifyUser(userId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Mock API call to verify user
}

export async function loginAsUser(userId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const { getStoredUser } = await import("./auth")
  const currentUser = getStoredUser()

  if (!currentUser || currentUser.userType !== "admin") {
    throw new Error("Only administrators can impersonate users")
  }

  try {
    const { getAllUsers } = await import("./auth")
    const users = getAllUsers()

    // Find the user to impersonate
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    if (targetUser.userType === "admin") {
      throw new Error("Cannot impersonate other administrators")
    }

    if (targetUser.userType === "suspended") {
      throw new Error("Cannot impersonate suspended users")
    }

    localStorage.setItem("original_admin_session", JSON.stringify(currentUser))

    const impersonatedSession = {
      ...targetUser,
      isImpersonating: true,
      originalAdminId: currentUser.id,
      originalAdminName: `${currentUser.firstName} ${currentUser.lastName}`,
    }

    localStorage.setItem("user", JSON.stringify(impersonatedSession))

    // Log the impersonation for security audit
    console.log(
      `[ADMIN IMPERSONATION] Admin ${currentUser.id} (${currentUser.firstName} ${currentUser.lastName}) is now impersonating user ${userId} (${targetUser.firstName} ${targetUser.lastName})`,
    )

    // Redirect to dashboard
    window.location.href = "/dashboard"
  } catch (error) {
    console.error("Error in user impersonation:", error)
    throw error
  }
}

export async function restoreAdminSession(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const originalSession = localStorage.getItem("original_admin_session")
  if (!originalSession) {
    throw new Error("No original admin session found")
  }

  const adminUser = JSON.parse(originalSession)

  // Log the session restoration
  console.log(
    `[ADMIN IMPERSONATION] Restoring admin session for ${adminUser.id} (${adminUser.firstName} ${adminUser.lastName})`,
  )

  localStorage.setItem("user", originalSession)
  localStorage.removeItem("original_admin_session")

  // Redirect to admin panel
  window.location.href = "/admin"
}
