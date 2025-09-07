"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, Search, User, Settings, LogOut, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CurrencyLanguageSwitcher } from "@/components/ui/currency-language-switcher"
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/lib/notifications"
import { formatDistanceToNow } from "date-fns"

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return

    try {
      const [userNotifications, unreadCountData] = await Promise.all([
        getUserNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ])

      setNotifications(userNotifications.slice(0, 5)) // Show latest 5 in dropdown
      setUnreadCount(unreadCountData)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      loadNotifications() // Refresh to update unread count
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <div className="border-b bg-white px-4 sm:px-6 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {description && <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{description}</p>}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search jobs, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48 lg:w-64 h-9"
            />
          </form>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>

          <div className="hidden md:block">
            <CurrencyLanguageSwitcher variant="compact" />
          </div>

          {/* Messages */}
          <Link href="/dashboard/messages">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <MessageCircle className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500">
                2
              </Badge>
            </Button>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start p-4 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{notification.title}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No notifications yet</div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="w-full text-center text-sm font-medium">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">@{user?.username}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <div className="md:hidden">
                <DropdownMenuSeparator />
                <div className="p-2">
                  <CurrencyLanguageSwitcher variant="compact" />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
