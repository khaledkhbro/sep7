"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  placeholder = "empty",
  blurDataURL,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", !isLoaded && "animate-pulse", className)}
      style={!fill ? { width, height } : undefined}
    >
      {isInView && !hasError && (
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn("transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}

      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
      )}
    </div>
  )
}
