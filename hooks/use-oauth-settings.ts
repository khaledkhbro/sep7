"use client"

import { useState, useEffect } from "react"

interface OAuthProvider {
  id: string
  provider: string
  enabled: boolean
  client_id: string
  client_secret: string
  redirect_url: string
  created_at: string
  updated_at: string
}

interface OAuthSettings {
  settings: OAuthProvider[]
}

export function useOAuthSettings() {
  const [settings, setSettings] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/oauth-settings")

      if (!response.ok) {
        throw new Error("Failed to fetch OAuth settings")
      }

      const data: OAuthSettings = await response.json()
      setSettings(data.settings || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (provider: string, config: Partial<OAuthProvider>) => {
    try {
      const response = await fetch("/api/admin/oauth-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          ...config,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save OAuth settings")
      }

      await fetchSettings() // Refresh settings
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    }
  }

  const toggleProvider = async (provider: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/oauth-settings/${provider}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to update OAuth provider")
      }

      await fetchSettings() // Refresh settings
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    }
  }

  const deleteProvider = async (provider: string) => {
    try {
      const response = await fetch(`/api/admin/oauth-settings/${provider}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete OAuth provider")
      }

      await fetchSettings() // Refresh settings
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    saveSettings,
    toggleProvider,
    deleteProvider,
    refetch: fetchSettings,
  }
}
