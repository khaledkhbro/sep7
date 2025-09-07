"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Briefcase,
  MessageCircle,
  DollarSign,
  AlertCircle,
  Settings,
} from "lucide-react"

interface Notification {
  id: string
  userId: string
  type: "job" | "message" | "payment" | "system"
  title: string
  description: string
  timestamp: string
  read: boolean
  actionUrl?: string
  recipientId?: string
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = () => {
    if (!user) return

    console.log("[v0] Loading notifications for user:", user.id)
    const allNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")

    console.log("[v0] All notifications in storage:", allNotifications.length)
    console.log(
      "[v0] Sample notification user IDs:",
      allNotifications.slice(0, 3).map((n: Notification) => ({ id: n.id, userId: n.userId, title: n.title })),
    )

    const userNotifications = allNotifications.filter((n: Notification) => {
      return (
        n.userId === user.id ||
        n.userId === user.username ||
        n.userId === `user-${user.id}` ||
        n.userId === `user_${user.id}` ||
        n.recipientId === user.id ||
        n.recipientId === user.username
      )
    })

    console.log("[v0] Found notifications:", userNotifications.length)
    console.log(
      "[v0] Matched notifications:",
      userNotifications.map((n: Notification) => ({ id: n.id, userId: n.userId, title: n.title })),
    )

    setNotifications(userNotifications)
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return

    loadNotifications()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "notifications") {
        console.log("[v0] Notifications updated in storage, reloading...")
        loadNotifications()
      }
    }

    const pollInterval = setInterval(() => {
      loadNotifications()
    }, 5000)

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(pollInterval)
    }
  }, [user])

  const markAsRead = (id: string) => {
    console.log("[v0] Marking notification as read:", id)
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )

    const allNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const updatedNotifications = allNotifications.map((n: Notification) => (n.id === id ? { ...n, read: true } : n))
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))

    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))

    toast({
      title: "Marked as read",
      description: "Notification has been marked as read.",
    })
  }

  const markAllAsRead = () => {
    if (!user) return

    console.log("[v0] Marking all notifications as read for user:", user.id)
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

    const allNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const updatedNotifications = allNotifications.map((n: Notification) =>
      n.userId === user.id ? { ...n, read: true } : n,
    )
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))

    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))

    toast({
      title: "All notifications marked as read",
      description: "All your notifications have been marked as read.",
    })
  }

  const deleteNotification = (id: string) => {
    console.log("[v0] Deleting notification:", id)
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))

    const allNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const updatedNotifications = allNotifications.filter((n: Notification) => n.id !== id)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))

    window.dispatchEvent(new StorageEvent("storage", { key: "notifications" }))

    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    })
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const allNotifications = notifications
  const unreadNotifications = notifications.filter((n) => !n.read)

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case "job":
          return <Briefcase className="w-5 h-5 text-blue-600" />
        case "message":
          return <MessageCircle className="w-5 h-5 text-green-600" />
        case "payment":
          return <DollarSign className="w-5 h-5 text-yellow-600" />
        case "system":
          return <AlertCircle className="w-5 h-5 text-orange-600" />
        default:
          return <Bell className="w-5 h-5 text-gray-600" />
      }
    }

    return (
      <Card className={`transition-all hover:shadow-md ${!notification.read ? "border-blue-200 bg-blue-50/30" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                  <p className="text-xs text-gray-500">{notification.timestamp}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      New
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Notifications" description="Stay updated with your latest activities and messages." />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Notifications" description="Stay updated with your latest activities and messages." />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
              </span>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Notifications Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allNotifications.length > 0 ? (
                allNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-600">You'll see notifications here when you have new activity.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">You have no unread notifications.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                <Settings className="w-4 h-4 mr-2" />
                Configure Notifications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
