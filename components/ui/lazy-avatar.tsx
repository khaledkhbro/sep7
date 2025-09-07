"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface LazyAvatarProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
  priority?: boolean
}

export function LazyAvatar({ src, alt, fallback, className, priority = false }: LazyAvatarProps) {
  const [isInView, setIsInView] = useState(priority)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || !src) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      },
    )

    if (avatarRef.current) {
      observer.observe(avatarRef.current)
    }

    return () => observer.disconnect()
  }, [priority, src])

  return (
    <div ref={avatarRef}>
      <Avatar className={cn(className)}>
        {isInView && src && (
          <AvatarImage src={src || "/placeholder.svg"} alt={alt} loading={priority ? "eager" : "lazy"} />
        )}
        <AvatarFallback className="bg-primary/10 text-primary">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  )
}
