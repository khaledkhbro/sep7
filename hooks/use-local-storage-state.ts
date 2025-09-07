"use client"

import { useState, useEffect, useCallback } from "react"
import { redis } from "@/lib/local-redis"

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  ttl?: number,
): [T, (value: T) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    const cached = redis.get<T>(key)
    return cached !== null ? cached : defaultValue
  })

  const setValue = useCallback(
    (value: T) => {
      setState(value)
      redis.set(key, value, ttl)
    },
    [key, ttl],
  )

  const clearValue = useCallback(() => {
    setState(defaultValue)
    redis.del(key)
  }, [key, defaultValue])

  useEffect(() => {
    const cached = redis.get<T>(key)
    if (cached !== null) {
      setState(cached)
    }
  }, [key])

  return [state, setValue, clearValue]
}
