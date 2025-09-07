"use client"

import { useEffect, useRef } from "react"

interface AdSenseAdProps {
  publisherId?: string
  autoAdsCode?: string
  width: number
  height: number
  placement: string
}

export function AdSenseAd({ publisherId, autoAdsCode, width, height, placement }: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!publisherId && !autoAdsCode) return

    const loadAdSenseScript = () => {
      if (scriptLoaded.current) return

      // Load AdSense script if auto ads code is provided
      if (autoAdsCode) {
        const scriptElement = document.createElement("div")
        scriptElement.innerHTML = autoAdsCode
        document.head.appendChild(scriptElement)
        scriptLoaded.current = true
        return
      }

      // Load standard AdSense script
      if (publisherId) {
        const script = document.createElement("script")
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
        script.crossOrigin = "anonymous"
        document.head.appendChild(script)
        scriptLoaded.current = true

        // Initialize ad after script loads
        script.onload = () => {
          if (adRef.current && window.adsbygoogle) {
            try {
              ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            } catch (error) {
              console.error("AdSense error:", error)
            }
          }
        }
      }
    }

    loadAdSenseScript()

    // Track ad impression
    const trackImpression = async () => {
      try {
        await fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: "adsense",
            placement,
            event: "impression",
          }),
        })
      } catch (error) {
        console.error("Failed to track impression:", error)
      }
    }

    trackImpression()
  }, [publisherId, autoAdsCode, placement])

  if (!publisherId && !autoAdsCode) {
    return null
  }

  return (
    <div className="adsense-ad" style={{ width, height }}>
      {publisherId && !autoAdsCode && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width, height }}
          data-ad-client={publisherId}
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
      {autoAdsCode && (
        <div className="auto-ads-placeholder" style={{ width, height }}>
          <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
            AdSense Auto Ads
          </div>
        </div>
      )}
    </div>
  )
}

// Extend window object for AdSense
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}
