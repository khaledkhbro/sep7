"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from "react"
import type { AuthState } from "@/lib/auth"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    username: string
  }) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => void
  signInWithOAuth: (provider: string) => Promise<void>
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Lazy load auth functions to reduce initial bundle size
        const { getStoredUser, initializeDefaultUsers } = await import("@/lib/auth")

        // Initialize default users asynchronously
        await new Promise((resolve) => {
          setTimeout(() => {
            initializeDefaultUsers()
            resolve(void 0)
          }, 0) // Defer to next tick
        })

        const storedUser = getStoredUser()
        setState({
          user: storedUser,
          isLoading: false,
          isAuthenticated: !!storedUser,
        })
      } catch (error) {
        console.error("[v0] Failed to initialize auth:", error)
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { signIn: authSignIn, storeUser } = await import("@/lib/auth")
      const user = await authSignIn(email, password)

      storeUser(user)
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signUp = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    username: string
  }) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { signUp: authSignUp, storeUser } = await import("@/lib/auth")
      const user = await authSignUp(data)

      storeUser(user)
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signInWithOAuth = async (provider: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { initiateOAuthFlow } = await import("@/lib/oauth")
      await initiateOAuthFlow(provider)
      // OAuth flow will redirect to provider, so we don't need to update state here
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const handleOAuthCallback = async (provider: string, code: string, state?: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { handleOAuthCallback: handleCallback, storeUser } = await import("@/lib/oauth")
      const user = await handleCallback(provider, code, state)

      storeUser(user)
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signOut = async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { signOut: authSignOut, clearStoredUser } = await import("@/lib/auth")
      await authSignOut()

      clearStoredUser()
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const refreshUser = () => {
    import("@/lib/auth").then(({ getStoredUser }) => {
      const storedUser = getStoredUser()
      setState({
        user: storedUser,
        isLoading: false,
        isAuthenticated: !!storedUser,
      })
    })
  }

  const contextValue = useMemo(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      refreshUser,
      signInWithOAuth,
      handleOAuthCallback,
    }),
    [state],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
