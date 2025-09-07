"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Menu, Shield } from "lucide-react"
import { AdContainer } from "@/components/ads/ad-container"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading, signIn } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  useEffect(() => {
    console.log("[v0] Admin layout auth state:", { user, isAuthenticated, isLoading, autoLoginAttempted })

    if (!isLoading && !autoLoginAttempted) {
      if (!isAuthenticated) {
        console.log("[v0] No user authenticated, attempting auto-login for admin")
        setAutoLoginAttempted(true)
        signIn("admin@marketplace.com", "admin123").catch((error) => {
          console.error("[v0] Auto-login failed:", error)
          router.push("/login")
        })
      } else if (user?.userType !== "admin") {
        console.log("[v0] User is not admin, redirecting to dashboard. User type:", user?.userType)
        router.push("/dashboard")
      } else {
        console.log("[v0] Admin user authenticated successfully")
      }
    }
  }, [isAuthenticated, isLoading, user, router, signIn, autoLoginAttempted])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router])

  if (isLoading || (!isAuthenticated && !autoLoginAttempted)) {
    console.log("[v0] Admin layout showing loading state")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.userType !== "admin") {
    console.log("[v0] Admin layout blocking access - not authenticated or not admin")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access denied. Admin privileges required.</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  console.log("[v0] Admin layout rendering admin interface")
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <AdminNav onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
        <div className="p-4 border-t">
          <AdContainer placement="sidebar" className="w-full" width={250} height={300} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="p-2">
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {children}
      </div>
    </div>
  )
}
