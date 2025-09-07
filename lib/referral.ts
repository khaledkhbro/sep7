export interface ReferralTarget {
  id: number
  packageTitle: string
  targetUsers: number
  prizeType: "amount" | "percentage"
  prizeTitle: string
  image?: string
  status: "active" | "inactive"
  createdAt: string
}

export interface ReferralSettings {
  firstDepositCommission: number
  microjobWorkBonus: number
  projectWorkBonus: number
  contestWorkBonus: number
  referPageTitle: string
  referPageText: string
  status: "active" | "inactive"
}

export interface UserReferralProgress {
  targetId: number
  currentProgress: number
  isCompleted: boolean
  appliedForPrize: boolean
  completedAt?: string
}

// Mock data that would come from admin settings
export const getReferralTargets = (): ReferralTarget[] => [
  {
    id: 1,
    packageTitle: "invite 1 person",
    targetUsers: 1,
    prizeType: "amount",
    prizeTitle: "$0.05",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    packageTitle: "invite 5 person",
    targetUsers: 5,
    prizeType: "amount",
    prizeTitle: "$0.25",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: 3,
    packageTitle: "invite 10 person",
    targetUsers: 10,
    prizeType: "amount",
    prizeTitle: "$0.50",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: 4,
    packageTitle: "invite 20 person",
    targetUsers: 20,
    prizeType: "amount",
    prizeTitle: "$1.00",
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: 5,
    packageTitle: "invite 50 person",
    targetUsers: 50,
    prizeType: "amount",
    prizeTitle: "$5.00",
    status: "active",
    createdAt: "2024-01-01",
  },
]

export const getReferralSettings = (): ReferralSettings => ({
  firstDepositCommission: 5.0,
  microjobWorkBonus: 2.0,
  projectWorkBonus: 0.0,
  contestWorkBonus: 0.0,
  referPageTitle: "Vip Refer",
  referPageText:
    "* Every Successfully Vip Refer For You Earn $\n* To Become a Vip Refer * Refer Have To Complete 3 Job ✅ Or\n* Refer have to Deposit Any Amount ✅\n* Every refers and Vip Refer from You get lifetime commission it's can be ( 0.05-20% )✅",
  status: "active",
})

// Mock user progress data
export const getUserReferralProgress = (userId: string): UserReferralProgress[] => [
  { targetId: 1, currentProgress: 1, isCompleted: true, appliedForPrize: false },
  { targetId: 2, currentProgress: 3, isCompleted: false, appliedForPrize: false },
  { targetId: 3, currentProgress: 8, isCompleted: false, appliedForPrize: false },
  { targetId: 4, currentProgress: 5, isCompleted: false, appliedForPrize: false },
  { targetId: 5, currentProgress: 2, isCompleted: false, appliedForPrize: false },
]

export const applyForPrize = async (targetId: number): Promise<boolean> => {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

export const generateReferralLink = (userId: string): string => {
  return `${window.location.origin}/register?ref=${userId}`
}
