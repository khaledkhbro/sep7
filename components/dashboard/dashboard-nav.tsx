"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/hooks/use-translation"
import { useNotifications } from "@/hooks/use-notifications"
import { useEffect } from "react"
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  Wallet,
  Bell,
  Settings,
  User,
  Users,
  LogOut,
  MessageCircle,
  X,
  Coins,
  Package,
  Heart,
  ShoppingCart,
} from "lucide-react"

const navigationWithNotifications = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, notificationKey: null },
  { name: "My Jobs", href: "/dashboard/jobs", icon: Briefcase, notificationKey: "myJobs" as const },
  { name: "Applied Jobs", href: "/dashboard/applied-jobs", icon: Users, notificationKey: "appliedJobs" as const },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart, notificationKey: "favorites" as const },
  { name: "My Services", href: "/dashboard/services", icon: ShoppingBag, notificationKey: "myServices" as const },
  {
    name: "Buyer Orders",
    href: "/dashboard/orders?view=buyer",
    icon: ShoppingCart,
    notificationKey: "buyerOrders" as const,
  },
  {
    name: "Seller Orders",
    href: "/dashboard/orders?view=seller",
    icon: Package,
    notificationKey: "sellerOrders" as const,
  },
  { name: "Messages", href: "/dashboard/messages", icon: MessageCircle, notificationKey: "messages" as const },
  { name: "Daily Coins", href: "/dashboard/coins", icon: Coins, notificationKey: "dailyCoins" as const },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet, notificationKey: "wallet" as const },
  { name: "Refer", href: "/dashboard/refer", icon: Users, notificationKey: "refer" as const },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, notificationKey: "notifications" as const },
  { name: "Profile", href: "/dashboard/profile", icon: User, notificationKey: "profile" as const },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, notificationKey: "settings" as const },
]

interface DashboardNavProps {
  onMobileMenuClose?: () => void
}

export function DashboardNav({ onMobileMenuClose }: DashboardNavProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const { counts, clearCount } = useNotifications()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const handleNavClick = (notificationKey: string | null) => {
    if (notificationKey && counts[notificationKey as keyof typeof counts] > 0) {
      clearCount(notificationKey as keyof typeof counts)
    }

    if (onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  useEffect(() => {
    const currentNavItem = navigationWithNotifications.find((item) => item.href === pathname)
    if (currentNavItem?.notificationKey && counts[currentNavItem.notificationKey] > 0) {
      clearCount(currentNavItem.notificationKey)
    }
  }, [pathname, counts, clearCount])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">WorkHub</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onMobileMenuClose} className="lg:hidden p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navigationWithNotifications.map((item) => {
          const isActive = pathname === item.href
          const notificationCount = item.notificationKey ? counts[item.notificationKey] : 0

          return (
            <Link key={item.name} href={item.href} onClick={() => handleNavClick(item.notificationKey)}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 sm:h-10 text-sm sm:text-base px-3 sm:px-4 relative",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                )}
              >
                <item.icon className="mr-3 h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
                {notificationCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{t("nav.signOut")}</span>
        </Button>
      </div>
    </div>
  )
}
