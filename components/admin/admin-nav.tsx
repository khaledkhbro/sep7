"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  AlertTriangle,
  UserPlus,
  MessageSquare,
  X,
  Tags,
  Camera,
  Coins,
  Star,
  HelpCircle,
  Package,
  Monitor,
  Bell,
  Trophy,
  TrendingUp,
  RotateCcw,
} from "lucide-react"

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Services", href: "/admin/services", icon: ShoppingBag },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Marketplace Categories", href: "/admin/marketplace-categories", icon: ShoppingBag },
  { name: "Marketplace Algorithm", href: "/admin/marketplace-algorithm", icon: TrendingUp },
  { name: "Microjob Algorithm", href: "/admin/microjob-algorithm", icon: RotateCcw }, // Added Microjob Algorithm to navigation
  { name: "Chat Management", href: "/admin/chat", icon: MessageSquare },
  { name: "Support Management", href: "/admin/support", icon: HelpCircle },
  { name: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { name: "Transactions", href: "/admin/transactions", icon: DollarSign },
  { name: "Wallet Management", href: "/admin/wallet-management", icon: DollarSign },
  { name: "Referral Management", href: "/admin/achievements", icon: Trophy },
  { name: "Referral Settings", href: "/admin/referral-settings", icon: UserPlus },
  { name: "Screenshot Pricing", href: "/admin/screenshot-pricing", icon: Camera },
  { name: "Coin Management", href: "/admin/coin-management", icon: Coins },
  { name: "Review Management", href: "/admin/reviews", icon: Star },
  { name: "Marketplace Reviews", href: "/admin/marketplace-reviews", icon: Star },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Reports", href: "/admin/reports", icon: AlertTriangle },
  { name: "Server Monitoring", href: "/admin/server-monitoring", icon: Monitor },
  { name: "Firebase Settings", href: "/admin/firebase-settings", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminNavProps {
  onMobileMenuClose?: () => void
}

export function AdminNav({ onMobileMenuClose }: AdminNavProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const handleNavClick = () => {
    if (onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onMobileMenuClose} className="lg:hidden p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="text-white h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} onClick={handleNavClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 sm:h-10 text-sm sm:text-base px-3 sm:px-4",
                  isActive && "bg-red-50 text-red-700 hover:bg-red-100",
                )}
              >
                <item.icon className="mr-3 h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t space-y-2">
        <Link href="/dashboard" onClick={handleNavClick}>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent h-12 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
          >
            <LayoutDashboard className="mr-3 h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Back to Dashboard</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}
