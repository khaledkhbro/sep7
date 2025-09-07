"use client"

import { useEffect, useRef } from "react"

interface AdsterraAdProps {
  publisherId?: string
  script?: string
  width: number
  height: number
  placement: string
}

export function AdsterraAd({ publisherId, script, width, height, placement }: AdsterraAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!publisherId && !script) return

    const loadAdsterraScript = () => {
      if (scriptLoaded.current) return

      if (script) {
        const scriptElement = document.createElement("div")
        scriptElement.innerHTML = script
        document.head.appendChild(scriptElement)
        scriptLoaded.current = true
      } else if (publisherId) {
        // Load Adsterra script
        const adsterraScript = document.createElement("script")
        adsterraScript.innerHTML = `
          atOptions = {
            'key' : '${publisherId}',
            'format' : 'iframe',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
        `
        document.head.appendChild(adsterraScript)

        const adsterraLoader = document.createElement("script")
        adsterraLoader.src = "//www.topcreativeformat.com/atOptions.js"
        document.head.appendChild(adsterraLoader)

        scriptLoaded.current = true
      }
    }

    loadAdsterraScript()

    // Track ad impression
    const trackImpression = async () => {
      try {
        await fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: "adsterra",
            placement,
            event: "impression",
          }),
        })
      } catch (error) {
        console.error("Failed to track impression:", error)
      }
    }

    trackImpression()
  }, [publisherId, script, width, height, placement])

  if (!publisherId && !script) {
    return null
  }

  return (
    <div className="adsterra-ad" style={{ width, height }}>
      <div ref={adRef} className="adsterra-ad-unit" style={{ width, height }}>
        <div className="flex items-center justify-center h-full bg-orange-50 text-orange-600 text-sm border border-orange-200 rounded">
          Adsterra Ad - {placement}
        </div>
      </div>
    </div>
  )
}
