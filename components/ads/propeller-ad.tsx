"use client"

import { useEffect, useRef } from "react"

interface PropellerAdProps {
  zoneId?: string
  script?: string
  width: number
  height: number
  placement: string
}

export function PropellerAd({ zoneId, script, width, height, placement }: PropellerAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!zoneId && !script) return

    const loadPropellerScript = () => {
      if (scriptLoaded.current) return

      if (script) {
        const scriptElement = document.createElement("div")
        scriptElement.innerHTML = script
        document.head.appendChild(scriptElement)
        scriptLoaded.current = true
      } else if (zoneId) {
        // Load PropellerAds script
        const propellerScript = document.createElement("script")
        propellerScript.innerHTML = `
          (function(s,u,z,p){
            s.src=u;
            s.setAttribute('data-zone',z);
            p.appendChild(s);
          })(document.createElement('script'),'https://iclickcdn.com/tag.min.js','${zoneId}',document.head);
        `
        document.head.appendChild(propellerScript)
        scriptLoaded.current = true
      }
    }

    loadPropellerScript()

    // Track ad impression
    const trackImpression = async () => {
      try {
        await fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: "propellerads",
            placement,
            event: "impression",
          }),
        })
      } catch (error) {
        console.error("Failed to track impression:", error)
      }
    }

    trackImpression()
  }, [zoneId, script, placement])

  if (!zoneId && !script) {
    return null
  }

  return (
    <div className="propeller-ad" style={{ width, height }}>
      <div ref={adRef} className="propeller-ad-unit" style={{ width, height }} data-zone={zoneId}>
        <div className="flex items-center justify-center h-full bg-purple-50 text-purple-600 text-sm border border-purple-200 rounded">
          PropellerAds - {placement}
        </div>
      </div>
    </div>
  )
}
