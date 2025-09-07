"use client"

import type React from "react"

import { Suspense, lazy, type ComponentType } from "react"
import { Loader2 } from "lucide-react"

interface LazyComponentProps {
  fallback?: React.ReactNode
  className?: string
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
) {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: React.ComponentProps<T> & LazyComponentProps) {
    const { fallback: customFallback, className, ...componentProps } = props

    const defaultFallback = (
      <div className={`flex items-center justify-center p-4 ${className || ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )

    return (
      <Suspense fallback={customFallback || fallback || defaultFallback}>
        <LazyComponent {...componentProps} />
      </Suspense>
    )
  }
}

export const LazyChart = createLazyComponent(
  () => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  <div className="h-64 bg-muted animate-pulse rounded-lg" />,
)

export const LazyDataTable = createLazyComponent(
  () => import("@/components/ui/data-table").then((mod) => ({ default: mod.DataTable })),
  <div className="h-96 bg-muted animate-pulse rounded-lg" />,
)
