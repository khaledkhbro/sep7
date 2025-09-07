// Coin system types and interfaces
export interface CoinSystemSettings {
  id: string
  isEnabled: boolean
  coinToUsdRate: number // How much 1 coin is worth in USD
  maxCoinsPerDay: number
  minCashoutCoins: number
  cashoutFeePercentage: number
  createdAt: string
  updatedAt: string
}

export interface DailyRewardSettings {
  id: string
  baseReward: number // Base coins for daily collection
  streakMultiplier: number // Multiplier for consecutive days
  maxStreakBonus: number // Maximum bonus coins from streak
  streakResetHours: number // Hours after which streak resets
  customDailyRewards?: number[] // Custom coin amounts for each day [day1, day2, ..., day7]
  createdAt: string
  updatedAt: string
}

export interface UserCoinData {
  userId: string
  totalCoins: number
  availableCoins: number // Coins that can be cashed out
  lastCollectionDate: string | null
  currentStreak: number
  longestStreak: number
  totalCollected: number
  totalCashedOut: number
  createdAt: string
  updatedAt: string
}

export interface CoinCollection {
  id: string
  userId: string
  coinsEarned: number
  streakDay: number
  bonusCoins: number
  collectionDate: string
  createdAt: string
}

export interface CoinCashout {
  id: string
  userId: string
  coinsAmount: number
  usdAmount: number
  feeAmount: number
  netAmount: number
  status: "pending" | "completed" | "failed"
  transactionId?: string
  createdAt: string
  processedAt?: string
}

export interface CoinStats {
  totalCoinsDistributed: number
  activeCollectors: number
  totalCoinsCashedOut: number
  todayCollections: number
  averageStreak: number
  recentActivity: Array<{
    username: string
    action: string
    coins: number
    timestamp: string
  }>
}

// Default settings
const DEFAULT_COIN_SETTINGS: CoinSystemSettings = {
  id: "coin_system_settings",
  isEnabled: true,
  coinToUsdRate: 0.0001, // 10,000 coins = $1 (100 coins = $0.01)
  maxCoinsPerDay: 1000,
  minCashoutCoins: 1000, // $0.10 minimum
  cashoutFeePercentage: 5, // 5% fee
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const DEFAULT_REWARD_SETTINGS: DailyRewardSettings = {
  id: "daily_reward_settings",
  baseReward: 20, // 20 coins base reward
  streakMultiplier: 1.5, // 50% bonus per streak day
  maxStreakBonus: 100, // Max 100 bonus coins
  streakResetHours: 48, // 48 hours to maintain streak
  customDailyRewards: [32, 50, 12, 75, 25, 90, 100], // Custom amounts for each day
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Coin system management functions
export async function getCoinSystemSettings(): Promise<CoinSystemSettings> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const settings = localStorage.getItem("coin_system_settings")
  if (!settings) {
    localStorage.setItem("coin_system_settings", JSON.stringify(DEFAULT_COIN_SETTINGS))
    return DEFAULT_COIN_SETTINGS
  }

  return JSON.parse(settings)
}

export async function updateCoinSystemSettings(settings: CoinSystemSettings): Promise<CoinSystemSettings> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const updatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("coin_system_settings", JSON.stringify(updatedSettings))
  return updatedSettings
}

export async function getDailyRewardSettings(): Promise<DailyRewardSettings> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const settings = localStorage.getItem("daily_reward_settings")
  if (!settings) {
    localStorage.setItem("daily_reward_settings", JSON.stringify(DEFAULT_REWARD_SETTINGS))
    return DEFAULT_REWARD_SETTINGS
  }

  return JSON.parse(settings)
}

export async function updateDailyRewardSettings(settings: DailyRewardSettings): Promise<DailyRewardSettings> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const updatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("daily_reward_settings", JSON.stringify(updatedSettings))
  return updatedSettings
}

export async function getCoinStats(): Promise<CoinStats> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  const coinData = JSON.parse(localStorage.getItem("user_coin_data") || "{}")
  const collections = JSON.parse(localStorage.getItem("coin_collections") || "[]")
  const cashouts = JSON.parse(localStorage.getItem("coin_cashouts") || "[]")

  // Calculate real statistics
  const users = Object.values(coinData) as UserCoinData[]
  const totalCoinsDistributed = users.reduce((sum, user) => sum + user.totalCollected, 0)
  const activeCollectors = users.filter((user) => user.totalCollected > 0).length
  const totalCoinsCashedOut = users.reduce((sum, user) => sum + user.totalCashedOut, 0)

  // Calculate today's collections
  const today = new Date().toDateString()
  const todayCollections = collections.filter(
    (collection: CoinCollection) => new Date(collection.createdAt).toDateString() === today,
  ).length

  // Calculate average streak
  const averageStreak = users.length > 0 ? users.reduce((sum, user) => sum + user.currentStreak, 0) / users.length : 0

  // Get real recent activity from collections
  const recentCollections = collections
    .sort((a: CoinCollection, b: CoinCollection) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentActivity = recentCollections.map((collection: CoinCollection) => {
    const user = users.find((u) => u.userId === collection.userId)
    const username = user ? `user_${collection.userId.slice(-4)}` : "Unknown User"

    return {
      username,
      action: `Daily collection (Day ${collection.streakDay})`,
      coins: collection.coinsEarned,
      timestamp: formatTimeAgo(collection.createdAt),
    }
  })

  // Add recent cashouts to activity
  const recentCashouts = cashouts
    .filter((cashout: CoinCashout) => cashout.status === "completed")
    .sort((a: CoinCashout, b: CoinCashout) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)

  recentCashouts.forEach((cashout: CoinCashout) => {
    const user = users.find((u) => u.userId === cashout.userId)
    const username = user ? `user_${cashout.userId.slice(-4)}` : "Unknown User"

    recentActivity.push({
      username,
      action: "Cashed out coins",
      coins: -cashout.coinsAmount,
      timestamp: formatTimeAgo(cashout.createdAt),
    })
  })

  // Sort all activity by timestamp and take top 5
  recentActivity
    .sort((a, b) => {
      const timeA = parseTimeAgo(a.timestamp)
      const timeB = parseTimeAgo(b.timestamp)
      return timeA - timeB
    })
    .splice(5)

  return {
    totalCoinsDistributed,
    activeCollectors,
    totalCoinsCashedOut,
    todayCollections,
    averageStreak: Number(averageStreak.toFixed(1)),
    recentActivity,
  }
}

// User coin management functions
export async function getUserCoinData(userId: string): Promise<UserCoinData> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const coinData = JSON.parse(localStorage.getItem("user_coin_data") || "{}")

  if (!coinData[userId]) {
    const newUserData: UserCoinData = {
      userId,
      totalCoins: 0,
      availableCoins: 0,
      lastCollectionDate: null,
      currentStreak: 0,
      longestStreak: 0,
      totalCollected: 0,
      totalCashedOut: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    coinData[userId] = newUserData
    localStorage.setItem("user_coin_data", JSON.stringify(coinData))
    return newUserData
  }

  return coinData[userId]
}

export async function collectDailyCoins(userId: string): Promise<{
  success: boolean
  coinsEarned: number
  streakDay: number
  bonusCoins: number
  nextCollectionTime: string
  message: string
}> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const coinSettings = await getCoinSystemSettings()
  const rewardSettings = await getDailyRewardSettings()

  if (!coinSettings.isEnabled) {
    return {
      success: false,
      coinsEarned: 0,
      streakDay: 0,
      bonusCoins: 0,
      nextCollectionTime: "",
      message: "Coin system is currently disabled",
    }
  }

  const userData = await getUserCoinData(userId)
  const now = new Date()
  const today = now.toDateString()

  // Check if user already collected today
  if (userData.lastCollectionDate && new Date(userData.lastCollectionDate).toDateString() === today) {
    const nextCollection = new Date(userData.lastCollectionDate)
    nextCollection.setDate(nextCollection.getDate() + 1)
    nextCollection.setHours(0, 0, 0, 0)

    return {
      success: false,
      coinsEarned: 0,
      streakDay: userData.currentStreak,
      bonusCoins: 0,
      nextCollectionTime: nextCollection.toISOString(),
      message: "You have already collected coins today. Come back tomorrow!",
    }
  }

  // Calculate streak
  let newStreak = 1
  if (userData.lastCollectionDate) {
    const lastCollection = new Date(userData.lastCollectionDate)
    const hoursSinceLastCollection = (now.getTime() - lastCollection.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastCollection <= rewardSettings.streakResetHours) {
      newStreak = userData.currentStreak + 1
    }
  }

  const customRewards = rewardSettings.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]
  const dayIndex = Math.min(newStreak - 1, 6) // Cap at day 7 (index 6)
  const totalCoins = customRewards[dayIndex] || rewardSettings.baseReward

  // Update user data
  const coinData = JSON.parse(localStorage.getItem("user_coin_data") || "{}")
  coinData[userId] = {
    ...userData,
    totalCoins: userData.totalCoins + totalCoins,
    availableCoins: userData.availableCoins + totalCoins,
    lastCollectionDate: now.toISOString(),
    currentStreak: newStreak,
    longestStreak: Math.max(userData.longestStreak, newStreak),
    totalCollected: userData.totalCollected + totalCoins,
    updatedAt: now.toISOString(),
  }
  localStorage.setItem("user_coin_data", JSON.stringify(coinData))

  // Record collection
  const collections = JSON.parse(localStorage.getItem("coin_collections") || "[]")
  const newCollection: CoinCollection = {
    id: `collection_${Date.now()}`,
    userId,
    coinsEarned: totalCoins,
    streakDay: newStreak,
    bonusCoins: 0, // No bonus calculation with custom rewards
    collectionDate: today,
    createdAt: now.toISOString(),
  }
  collections.push(newCollection)
  localStorage.setItem("coin_collections", JSON.stringify(collections))

  const nextCollection = new Date(now)
  nextCollection.setDate(nextCollection.getDate() + 1)
  nextCollection.setHours(0, 0, 0, 0)

  return {
    success: true,
    coinsEarned: totalCoins,
    streakDay: newStreak,
    bonusCoins: 0, // No bonus with custom rewards
    nextCollectionTime: nextCollection.toISOString(),
    message: `Congratulations! You earned ${totalCoins} coins for day ${newStreak}!`,
  }
}

export async function cashoutCoins(userId: string, coinsAmount: number): Promise<CoinCashout> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const coinSettings = await getCoinSystemSettings()
  const userData = await getUserCoinData(userId)

  if (coinsAmount < coinSettings.minCashoutCoins) {
    throw new Error(`Minimum cashout is ${coinSettings.minCashoutCoins} coins`)
  }

  if (coinsAmount > userData.availableCoins) {
    throw new Error("Insufficient coins for cashout")
  }

  const usdAmount = coinsAmount * coinSettings.coinToUsdRate
  const feeAmount = usdAmount * (coinSettings.cashoutFeePercentage / 100)
  const netAmount = usdAmount - feeAmount

  const cashout: CoinCashout = {
    id: `cashout_${Date.now()}`,
    userId,
    coinsAmount,
    usdAmount,
    feeAmount,
    netAmount,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  // Update user coin data
  const coinData = JSON.parse(localStorage.getItem("user_coin_data") || "{}")
  coinData[userId] = {
    ...userData,
    availableCoins: userData.availableCoins - coinsAmount,
    totalCashedOut: userData.totalCashedOut + coinsAmount,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem("user_coin_data", JSON.stringify(coinData))

  // Record cashout
  const cashouts = JSON.parse(localStorage.getItem("coin_cashouts") || "[]")
  cashouts.push(cashout)
  localStorage.setItem("coin_cashouts", JSON.stringify(cashouts))

  return cashout
}

// Helper functions
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`

  return date.toLocaleDateString()
}

function parseTimeAgo(timeAgo: string): number {
  if (timeAgo === "Just now") return 0

  const match = timeAgo.match(/(\d+)\s+(minute|hour|day)s?\s+ago/)
  if (!match) return Date.now() // fallback for dates

  const value = Number.parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case "minute":
      return value
    case "hour":
      return value * 60
    case "day":
      return value * 60 * 24
    default:
      return Date.now()
  }
}
