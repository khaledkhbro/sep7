"use client"

import { useState, useEffect, useCallback } from "react"
import { cacheUtils } from "@/lib/local-redis"

interface UseCachedApiOptions {
  ttl?: number // Cache TTL in seconds
  enabled?: boolean // Whether to fetch data
  refetchOnMount?: boolean // Refetch even if cached
}

export function useCachedApi<T>(endpoint: string, fetcher: () => Promise<T>, options: UseCachedApiOptions = {}) {
  const { ttl = 300, enabled = true, refetchOnMount = false } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return

      // Check cache first
      if (!forceRefresh) {
        const cached = cacheUtils.getCachedApiResponse<T>(endpoint)
        if (cached) {
          setData(cached)
          return cached
        }
      }

      setLoading(true)
      setError(null)

      try {
        const result = await fetcher()
        setData(result)

        // Cache the result
        cacheUtils.cacheApiResponse(endpoint, result, ttl)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [endpoint, fetcher, ttl, enabled],
  )

  useEffect(() => {
    fetchData(refetchOnMount)
  }, [fetchData, refetchOnMount])

  const refetch = useCallback(() => fetchData(true), [fetchData])
  const invalidate = useCallback(() => {
    cacheUtils.redis.del(`api:${endpoint}`)
  }, [endpoint])

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  }
}
