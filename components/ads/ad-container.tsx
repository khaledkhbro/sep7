"use client"

import { useEffect, useState } from "react"
import { AdSenseAd } from "./adsense-ad"
import { EzoicAd } from "./ezoic-ad"
import { PropellerAd } from "./propeller-ad"
import { AdsterraAd } from "./adsterra-ad"

export interface AdNetwork {
  network_name: string
  publisher_id?: string
  site_id?: string
  zone_id?: string
  api_key?: string
  script_code?: string
  auto_ads_code?: string
}

interface AdContainerProps {
  placement: "header" | "sidebar" | "footer" | "content"
  className?: string
  width?: number
  height?: number
}

export function AdContainer({ placement, className = "", width = 300, height = 250 }: AdContainerProps) {
  const [adNetworks, setAdNetworks] = useState<AdNetwork[]>([])
  const [enabledPlacements, setEnabledPlacements] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdSettings = async () => {
      try {
        const [networksResponse, placementsResponse] = await Promise.all([
          fetch("/api/ads/networks"),
          fetch("/api/ads/placements"),
        ])

        if (networksResponse.ok && placementsResponse.ok) {
          const networks = await networksResponse.json()
          const placements = await placementsResponse.json()

          // Validate networks data
          if (Array.isArray(networks)) {
            setAdNetworks(networks)
          } else {
            console.warn("Ad networks API returned invalid data:", networks)
            setAdNetworks([])
          }

          // Validate placements data
          if (Array.isArray(placements)) {
            setEnabledPlacements(placements.map((p: any) => p.placement_name).filter(Boolean))
          } else {
            console.warn("Ad placements API returned invalid data:", placements)
            setEnabledPlacements([])
          }
        } else {
          console.warn("Ad API requests failed:", {
            networks: networksResponse.status,
            placements: placementsResponse.status,
          })
          setAdNetworks([])
          setEnabledPlacements([])
        }
      } catch (error) {
        console.error("Failed to fetch ad settings:", error)
        setAdNetworks([])
        setEnabledPlacements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAdSettings()
  }, [])

  // Don't render if placement is not enabled
  if (!enabledPlacements.includes(placement) || loading) {
    return null
  }

  // Don't render if no ad networks are enabled
  if (adNetworks.length === 0) {
    return null
  }

  // Select the first enabled network (you can implement rotation logic here)
  const selectedNetwork = adNetworks[0]
  if (!selectedNetwork || !selectedNetwork.network_name) {
    return null
  }

  const renderAd = () => {
    switch (selectedNetwork.network_name) {
      case "adsense":
        return (
          <AdSenseAd
            publisherId={selectedNetwork.publisher_id}
            autoAdsCode={selectedNetwork.auto_ads_code}
            width={width}
            height={height}
            placement={placement}
          />
        )
      case "ezoic":
        return (
          <EzoicAd
            siteId={selectedNetwork.site_id}
            script={selectedNetwork.script_code}
            width={width}
            height={height}
            placement={placement}
          />
        )
      case "propellerads":
        return (
          <PropellerAd
            zoneId={selectedNetwork.zone_id}
            script={selectedNetwork.script_code}
            width={width}
            height={height}
            placement={placement}
          />
        )
      case "adsterra":
        return (
          <AdsterraAd
            publisherId={selectedNetwork.publisher_id}
            script={selectedNetwork.script_code}
            width={width}
            height={height}
            placement={placement}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`ad-container ${className}`} data-placement={placement}>
      {renderAd()}
    </div>
  )
}
