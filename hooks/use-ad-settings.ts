"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

interface AdNetworkSetting {
  network_name: string
  is_enabled: boolean
  publisher_id?: string
  site_id?: string
  zone_id?: string
  api_key?: string
  script_code?: string
  auto_ads_code?: string
}

interface AdPlacementSetting {
  placement_name: string
  is_enabled: boolean
  priority: number
}

interface AdSettings {
  networks: AdNetworkSetting[]
  placements: AdPlacementSetting[]
}

export function useAdSettings() {
  const [settings, setSettings] = useState<AdSettings>({ networks: [], placements: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/ad-settings")

      if (!response.ok) {
        throw new Error("Failed to fetch ad settings")
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Error fetching ad settings:", error)
      toast.error("Failed to load ad settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updatedSettings: Partial<AdSettings>) => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/ad-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to save ad settings")
      }

      toast.success("Ad settings saved successfully")
      await fetchSettings() // Refresh settings
    } catch (error) {
      console.error("Error saving ad settings:", error)
      toast.error("Failed to save ad settings")
    } finally {
      setSaving(false)
    }
  }

  const updateNetworkSetting = (networkName: string, updates: Partial<AdNetworkSetting>) => {
    setSettings((prev) => ({
      ...prev,
      networks: prev.networks.map((network) =>
        network.network_name === networkName ? { ...network, ...updates } : network,
      ),
    }))
  }

  const updatePlacementSetting = (placementName: string, updates: Partial<AdPlacementSetting>) => {
    setSettings((prev) => ({
      ...prev,
      placements: prev.placements.map((placement) =>
        placement.placement_name === placementName ? { ...placement, ...updates } : placement,
      ),
    }))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    saveSettings,
    updateNetworkSetting,
    updatePlacementSetting,
  }
}
