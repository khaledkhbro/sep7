"use client"

import { useEffect, useRef } from "react"

interface EzoicAdProps {
  siteId?: string
  script?: string
  width: number
  height: number
  placement: string
}

export function EzoicAd({ siteId, script, width, height, placement }: EzoicAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!siteId && !script) return

    const loadEzoicScript = () => {
      if (scriptLoaded.current) return

      if (script) {
        const scriptElement = document.createElement("div")
        scriptElement.innerHTML = script
        document.head.appendChild(scriptElement)
        scriptLoaded.current = true
      } else if (siteId) {
        // Load default Ezoic script
        const ezoicScript = document.createElement("script")
        ezoicScript.innerHTML = `
          window.ezstandalone = window.ezstandalone || {};
          ezstandalone.cmd = ezstandalone.cmd || [];
          ezstandalone.cmd.push(function() {
            ezstandalone.define(${siteId});
          });
        `
        document.head.appendChild(ezoicScript)
        scriptLoaded.current = true
      }
    }

    loadEzoicScript()

    // Track ad impression
    const trackImpression = async () => {
      try {
        await fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: "ezoic",
            placement,
            event: "impression",
          }),
        })
      } catch (error) {
        console.error("Failed to track impression:", error)
      }
    }

    trackImpression()
  }, [siteId, script, placement])

  if (!siteId && !script) {
    return null
  }

  return (
    <div className="ezoic-ad" style={{ width, height }}>
      <div
        ref={adRef}
        className="ezoic-ad-unit"
        style={{ width, height }}
        data-ezoic-ad-unit={`${placement}-${siteId}`}
      >
        <div className="flex items-center justify-center h-full bg-green-50 text-green-600 text-sm border border-green-200 rounded">
          Ezoic Ad - {placement}
        </div>
      </div>
    </div>
  )
}
