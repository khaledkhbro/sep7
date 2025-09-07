"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminSetupPage() {
  const { signIn } = useAuth() // Changed from login to signIn to match auth context
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const adminCredentials = {
    email: "admin@marketplace.com",
    password: "admin123",
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleDirectAdminAccess = async () => {
    setIsLoggingIn(true)
    try {
      await signIn(adminCredentials.email, adminCredentials.password) // Changed from login to signIn function call
      router.push("/admin")
    } catch (error) {
      console.error("Admin login error:", error)
      alert("Error logging in as admin")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Admin Panel Access</CardTitle>
          <CardDescription>Use these credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email:</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">{adminCredentials.email}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(adminCredentials.email)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password:</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">{adminCredentials.password}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(adminCredentials.password)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Link href="/login">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Go to Login Page
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleDirectAdminAccess}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : "Direct to Admin Panel"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            <p>
              After logging in with these credentials, you'll have full admin access to manage users, jobs, services,
              and platform analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
