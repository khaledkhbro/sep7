"use client"

import type React from "react"

import { useState } from "react"
import { Bell, Search, AlertTriangle, User, Settings, LogOut, Shield } from "lucide-react"
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

interface AdminHeaderProps {
  title: string
  description?: string
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
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
              placeholder="Search platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48 lg:w-64 h-9"
            />
          </form>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>

          {/* System Alerts */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500">
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>System Alerts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-medium text-sm text-orange-900">High withdrawal volume</div>
                  <div className="text-xs text-orange-700 mt-1">15 withdrawal requests pending review</div>
                  <div className="text-xs text-orange-600 mt-1">2 hours ago</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-medium text-sm text-yellow-900">Server response time increased</div>
                  <div className="text-xs text-yellow-700 mt-1">Average response time: 1.2s (normal: 0.8s)</div>
                  <div className="text-xs text-yellow-600 mt-1">1 hour ago</div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/alerts" className="w-full text-center text-sm font-medium">
                  View all alerts
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Admin Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-medium text-sm">New user registration</div>
                  <div className="text-xs text-gray-500 mt-1">John Doe registered and needs verification</div>
                  <div className="text-xs text-gray-400 mt-1">5 minutes ago</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-medium text-sm">Job requires approval</div>
                  <div className="text-xs text-gray-500 mt-1">React Developer position submitted for review</div>
                  <div className="text-xs text-gray-400 mt-1">15 minutes ago</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-medium text-sm">Support ticket created</div>
                  <div className="text-xs text-gray-500 mt-1">User reported payment issue</div>
                  <div className="text-xs text-gray-400 mt-1">30 minutes ago</div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/notifications" className="w-full text-center text-sm font-medium">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-red-100 text-red-700">
                    <Shield className="h-4 w-4" />
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
                  <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  User Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </Link>
              </DropdownMenuItem>
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
