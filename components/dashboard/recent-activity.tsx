"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { getUserRecentActivity } from "@/lib/dashboard-stats"
import { getUserNotifications } from "@/lib/notifications"
import { getTransactions } from "@/lib/wallet"
import {
  DollarSign,
  Briefcase,
  Bell,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Eye,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface EnhancedActivityItem {
  id: string
  type: "job_applied" | "application_accepted" | "payment_received" | "job_completed" | "notification" | "transaction"
  title: string
  description: string
  timestamp: string
  status: "pending" | "info" | "success" | "completed" | "failed"
  amount?: number
  isUnread?: boolean
  actionUrl?: string
  transactionType?: "deposit" | "withdrawal" | "payment" | "earning" | "refund"
}

const getActivityIcon = (item: EnhancedActivityItem) => {
  if (item.type === "notification") {
    return <Bell className="h-4 w-4" />
  }

  if (item.type === "transaction") {
    switch (item.transactionType) {
      case "deposit":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "earning":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "payment":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  switch (item.type) {
    case "job_applied":
      return <Briefcase className="h-4 w-4" />
    case "application_accepted":
      return <Briefcase className="h-4 w-4 text-green-600" />
    case "payment_received":
      return <DollarSign className="h-4 w-4 text-green-600" />
    case "job_completed":
      return <Briefcase className="h-4 w-4 text-blue-600" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getStatusColor = (status: EnhancedActivityItem["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "info":
      return "bg-blue-100 text-blue-800"
    case "success":
    case "completed":
      return "bg-green-100 text-green-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function RecentActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<EnhancedActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Loading comprehensive recent activities for user:", user.id)

        const [dashboardActivities, notifications, transactions] = await Promise.all([
          getUserRecentActivity(user.id, 3),
          getUserNotifications(user.id),
          getTransactions(`wallet_${user.id}`, { limit: 5 }),
        ])

        console.log("[v0] Loaded dashboard activities:", dashboardActivities.length)
        console.log("[v0] Loaded notifications:", notifications.length)
        console.log("[v0] Loaded transactions:", transactions.length)

        const combinedActivities: EnhancedActivityItem[] = []

        dashboardActivities.forEach((activity) => {
          combinedActivities.push({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            timestamp: activity.timestamp,
            status: activity.status,
            amount: activity.amount,
          })
        })

        notifications.slice(0, 3).forEach((notification) => {
          combinedActivities.push({
            id: notification.id,
            type: "notification",
            title: notification.title,
            description: notification.description,
            timestamp: notification.timestamp,
            status: notification.read ? "info" : "pending",
            isUnread: !notification.read,
            actionUrl: notification.actionUrl,
          })
        })

        transactions.slice(0, 3).forEach((transaction) => {
          combinedActivities.push({
            id: transaction.id,
            type: "transaction",
            title: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`,
            description: transaction.description,
            timestamp: transaction.createdAt,
            status:
              transaction.status === "completed" ? "success" : transaction.status === "failed" ? "failed" : "pending",
            amount: Math.abs(transaction.amount),
            transactionType: transaction.type,
            actionUrl: "/dashboard/wallet",
          })
        })

        const sortedActivities = combinedActivities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 8)

        console.log("[v0] Combined and sorted activities:", sortedActivities.length)
        setActivities(sortedActivities)
      } catch (error) {
        console.error("[v0] Error loading comprehensive activities:", error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    loadActivities()

    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-emerald-600">Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-emerald-600">Recent Activity</span>
          </div>
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all hover:bg-gray-50 ${
                activity.isUnread ? "bg-blue-50 border-l-4 border-blue-500" : ""
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
                  {getActivityIcon(activity)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                      {activity.isUnread && (
                        <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    {activity.amount && (
                      <span
                        className={`text-sm font-medium ${
                          activity.transactionType === "earning" ||
                          activity.transactionType === "deposit" ||
                          activity.transactionType === "refund"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {activity.transactionType === "earning" ||
                        activity.transactionType === "deposit" ||
                        activity.transactionType === "refund"
                          ? "+"
                          : "-"}
                        ${activity.amount.toFixed(2)}
                      </span>
                    )}
                    <Badge variant="secondary" className={`${getStatusColor(activity.status)} text-xs`}>
                      {activity.status === "success" ? "completed" : activity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">
              Your activities will appear here as you apply for jobs, complete work, and make transactions
            </p>
          </div>
        )}

        {activities.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <Link href="/dashboard/notifications" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-transparent hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Notifications
                </Button>
              </Link>
              <Link href="/dashboard/wallet" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-transparent hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Wallet
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function createActivity(activity: {
  userId: string
  type: "job_application" | "order_received" | "payment" | "review"
  title: string
  description: string
  status?: "pending" | "completed" | "in_progress"
  amount?: number
}) {
  const allActivities = JSON.parse(localStorage.getItem("user_activities") || "[]")
  const newActivity = {
    ...activity,
    id: `activity_${Date.now()}`,
    timestamp: new Date(),
  }

  allActivities.push(newActivity)
  localStorage.setItem("user_activities", JSON.stringify(allActivities))

  return newActivity
}
