"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>

          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="text-left text-xs text-gray-500 mt-4">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                {error.message}
                {error.stack && `\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
