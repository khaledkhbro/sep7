"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function OAuthCallbackPage({ params }: { params: { provider: string } }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleOAuthCallback } = useAuth()

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const errorParam = searchParams.get("error")

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`)
        }

        if (!code) {
          throw new Error("Authorization code not received")
        }

        console.log(`[v0] Processing OAuth callback for ${params.provider}`)

        await handleOAuthCallback(params.provider, code, state || undefined)

        setStatus("success")

        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (err) {
        console.error(`[v0] OAuth callback error for ${params.provider}:`, err)
        setError(err instanceof Error ? err.message : "Authentication failed")
        setStatus("error")

        // Redirect to login page after error
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    processCallback()
  }, [params.provider, searchParams, handleOAuthCallback, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === "error" && <XCircle className="w-5 h-5 text-red-600" />}

            {status === "loading" && "Authenticating..."}
            {status === "success" && "Success!"}
            {status === "error" && "Authentication Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && `Completing ${params.provider} authentication`}
            {status === "success" && "You have been successfully authenticated. Redirecting to dashboard..."}
            {status === "error" && "There was an error during authentication. Redirecting to login..."}
          </CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">{error}</div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
