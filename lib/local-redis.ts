/**
 * Local Redis-like caching utility using browser storage
 * Provides Redis-like methods for client-side caching
 */

interface CacheItem<T> {
  value: T
  expiry?: number
  timestamp: number
}

class LocalRedis {
  private prefix: string
  private storage: Storage

  constructor(prefix = "redis:", useSessionStorage = false) {
    this.prefix = prefix
    this.storage = useSessionStorage ? sessionStorage : localStorage
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private isExpired(item: CacheItem<any>): boolean {
    if (!item.expiry) return false
    return Date.now() > item.expiry
  }

  // SET - Store a value with optional expiration (in seconds)
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl * 1000 : undefined,
      }

      this.storage.setItem(this.getKey(key), JSON.stringify(item))
      return true
    } catch (error) {
      console.warn("[LocalRedis] Failed to set item:", error)
      return false
    }
  }

  // GET - Retrieve a value
  get<T>(key: string): T | null {
    try {
      const stored = this.storage.getItem(this.getKey(key))
      if (!stored) return null

      const item: CacheItem<T> = JSON.parse(stored)

      if (this.isExpired(item)) {
        this.del(key)
        return null
      }

      return item.value
    } catch (error) {
      console.warn("[LocalRedis] Failed to get item:", error)
      return null
    }
  }

  // DEL - Delete a key
  del(key: string): boolean {
    try {
      this.storage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.warn("[LocalRedis] Failed to delete item:", error)
      return false
    }
  }

  // EXISTS - Check if key exists and is not expired
  exists(key: string): boolean {
    return this.get(key) !== null
  }

  // EXPIRE - Set expiration for existing key
  expire(key: string, ttl: number): boolean {
    const value = this.get(key)
    if (value === null) return false
    return this.set(key, value, ttl)
  }

  // TTL - Get time to live for a key
  ttl(key: string): number {
    try {
      const stored = this.storage.getItem(this.getKey(key))
      if (!stored) return -2 // Key doesn't exist

      const item: CacheItem<any> = JSON.parse(stored)
      if (!item.expiry) return -1 // No expiration set

      const remaining = Math.ceil((item.expiry - Date.now()) / 1000)
      return remaining > 0 ? remaining : -2 // Expired
    } catch (error) {
      return -2
    }
  }

  // KEYS - Get all keys matching pattern (simple wildcard support)
  keys(pattern?: string): string[] {
    try {
      const keys: string[] = []
      const prefixLength = this.prefix.length

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const cleanKey = key.substring(prefixLength)

          if (!pattern || this.matchPattern(cleanKey, pattern)) {
            // Check if not expired
            if (this.exists(cleanKey)) {
              keys.push(cleanKey)
            }
          }
        }
      }

      return keys
    } catch (error) {
      console.warn("[LocalRedis] Failed to get keys:", error)
      return []
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    // Simple wildcard matching (* only)
    if (pattern === "*") return true

    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
    return regex.test(key)
  }

  // FLUSHALL - Clear all cache
  flushall(): boolean {
    try {
      const keysToDelete = this.keys("*")
      keysToDelete.forEach((key) => this.del(key))
      return true
    } catch (error) {
      console.warn("[LocalRedis] Failed to flush all:", error)
      return false
    }
  }

  // HSET - Hash set (store object fields)
  hset(key: string, field: string, value: any): boolean {
    const hash = this.get<Record<string, any>>(key) || {}
    hash[field] = value
    return this.set(key, hash)
  }

  // HGET - Hash get (get object field)
  hget<T>(key: string, field: string): T | null {
    const hash = this.get<Record<string, any>>(key)
    return hash ? hash[field] || null : null
  }

  // HGETALL - Get all hash fields
  hgetall<T>(key: string): Record<string, T> | null {
    return this.get<Record<string, T>>(key)
  }

  // HDEL - Delete hash field
  hdel(key: string, field: string): boolean {
    const hash = this.get<Record<string, any>>(key)
    if (!hash || !(field in hash)) return false

    delete hash[field]
    return this.set(key, hash)
  }

  // INCR - Increment number
  incr(key: string): number {
    const current = this.get<number>(key) || 0
    const newValue = current + 1
    this.set(key, newValue)
    return newValue
  }

  // DECR - Decrement number
  decr(key: string): number {
    const current = this.get<number>(key) || 0
    const newValue = current - 1
    this.set(key, newValue)
    return newValue
  }

  // Get storage usage info
  info(): { keys: number; size: string; storage: string } {
    const keys = this.keys("*")
    let totalSize = 0

    keys.forEach((key) => {
      const item = this.storage.getItem(this.getKey(key))
      if (item) totalSize += item.length
    })

    return {
      keys: keys.length,
      size: `${(totalSize / 1024).toFixed(2)} KB`,
      storage: this.storage === localStorage ? "localStorage" : "sessionStorage",
    }
  }
}

// Create singleton instances
export const redis = new LocalRedis("redis:", false)
export const sessionRedis = new LocalRedis("session:", true)

// Export class for custom instances
export { LocalRedis }

// Utility functions for common caching patterns
export const cacheUtils = {
  setJSON: <T,>(key: string, data: T, ttl?: number) => redis.set(key, data, ttl),

  getJSON: <T,>(key: string): T | null => redis.get<T>(key),

  cacheApiResponse: <T,>(endpoint: string, data: T, ttl = 300) => redis.set(`api:${endpoint}`, data, ttl),

  getCachedApiResponse: <T,>(endpoint: string): T | null => redis.get<T>(`api:${endpoint}`),

  cacheUser: (userId: string, userData: any, ttl = 1800) => redis.set(`user:${userId}`, userData, ttl),

  getCachedUser: (userId: string) => redis.get(`user:${userId}`),

  cacheJobs: (filters: string, jobs: any[], ttl = 600) => {
    const key = `jobs:${btoa(filters)}`
    return redis.set(key, jobs, ttl)
  },

  getCachedJobs: (filters: string) => {
    const key = `jobs:${btoa(filters)}`
    return redis.get<any[]>(key)
  },

  cacheDashboardStats: (userId: string, stats: any, ttl = 300) => redis.set(`dashboard:${userId}`, stats, ttl),

  getCachedDashboardStats: (userId: string) => redis.get(`dashboard:${userId}`),
}
