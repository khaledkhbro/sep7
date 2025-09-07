"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Mail, Lock } from "lucide-react"
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const { signIn, signInWithOAuth, isLoading } = useAuth()
  const router = useRouter()

  const handleSocialAuth = async (provider: "google" | "facebook" | "twitter") => {
    setSocialLoading(provider)
    setError("")

    try {
      console.log(`[v0] Initiating ${provider} authentication...`)
      await signInWithOAuth(provider)
      // OAuth flow will redirect to provider, so no need to handle success here
    } catch (err) {
      console.error(`[v0] OAuth error for ${provider}:`, err)
      setError(err instanceof Error ? err.message : `Failed to authenticate with ${provider}`)
      setSocialLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setError("")
    alert("Password reset functionality is not yet implemented. Please contact support.")
    setShowForgotPassword(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">Sign in to your WorkHub account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => handleSocialAuth("google")}
            disabled={isLoading || socialLoading !== null}
          >
            {socialLoading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => handleSocialAuth("facebook")}
            disabled={isLoading || socialLoading !== null}
          >
            {socialLoading === "facebook" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
            )}
            Continue with Facebook
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => handleSocialAuth("twitter")}
            disabled={isLoading || socialLoading !== null}
          >
            {socialLoading === "twitter" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
            )}
            Continue with Twitter
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <p>Demo Admin: admin@marketplace.com / admin123</p>
        </div>
      </CardContent>
    </Card>
  )
}
