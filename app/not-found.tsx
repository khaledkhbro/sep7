"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>
          <CardTitle className="text-2xl text-gray-900">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">The page you're looking for doesn't exist or has been moved.</p>

          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>

            <Link href="/search">
              <Button variant="outline" className="w-full bg-transparent">
                <Search className="mr-2 h-4 w-4" />
                Search Platform
              </Button>
            </Link>

            <Button variant="ghost" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
