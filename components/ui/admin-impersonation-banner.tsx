"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { restoreAdminSession } from "@/lib/admin"
import { Shield, LogOut } from "lucide-react"

export function AdminImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [originalAdminId, setOriginalAdminId] = useState<string | null>(null)

  useEffect(() => {
    const checkImpersonation = () => {
      const userSession = localStorage.getItem("user_session")
      if (userSession) {
        const userData = JSON.parse(userSession)
        if (userData.isImpersonating) {
          setIsImpersonating(true)
          setOriginalAdminId(userData.originalAdminId)
        }
      }
    }

    checkImpersonation()
  }, [])

  const handleRestoreSession = async () => {
    try {
      await restoreAdminSession()
    } catch (error) {
      console.error("Failed to restore admin session:", error)
      alert("Failed to restore admin session. Please try again.")
    }
  }

  if (!isImpersonating) return null

  return (
    <Alert className="bg-yellow-50 border-yellow-200 mb-4">
      <Shield className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-yellow-800">You are currently impersonating this user as an administrator.</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRestoreSession}
          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 bg-transparent"
        >
          <LogOut className="mr-1 h-3 w-3" />
          Return to Admin
        </Button>
      </AlertDescription>
    </Alert>
  )
}
