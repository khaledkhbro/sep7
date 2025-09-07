"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AdminImpersonationBanner } from "@/components/ui/admin-impersonation-banner"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { Button } from "@/components/ui/button"
import { Menu, AlertTriangle } from "lucide-react"
import { AdContainer } from "@/components/ads/ad-container"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.userType === "suspended") {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, user, router])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (user?.userType === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-4">Your account has been suspended and you cannot access the dashboard.</p>
          {user.suspensionReason && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Reason:</strong> {user.suspensionReason}
              </p>
            </div>
          )}
          <Button onClick={() => router.push("/login")} variant="outline">
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <NotificationProvider>
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
          <DashboardNav onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
          <div className="p-4 border-t">
            <AdContainer placement="sidebar" className="w-full" width={250} height={300} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900">WorkHub</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="p-2">
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <AdminImpersonationBanner />

          {children}
        </div>
      </div>
    </NotificationProvider>
  )
}
