"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { redis, sessionRedis } from "@/lib/local-redis"
import { Trash2, RefreshCw, Database, Clock } from "lucide-react"

export function CacheManager() {
  const [cacheInfo, setCacheInfo] = useState({
    localStorage: { keys: 0, size: "0 KB", storage: "localStorage" },
    sessionStorage: { keys: 0, size: "0 KB", storage: "sessionStorage" },
  })
  const [keys, setKeys] = useState<{ local: string[]; session: string[] }>({
    local: [],
    session: [],
  })

  const refreshInfo = () => {
    setCacheInfo({
      localStorage: redis.info(),
      sessionStorage: sessionRedis.info(),
    })
    setKeys({
      local: redis.keys("*"),
      session: sessionRedis.keys("*"),
    })
  }

  useEffect(() => {
    refreshInfo()
  }, [])

  const clearAllCache = () => {
    redis.flushall()
    sessionRedis.flushall()
    refreshInfo()
  }

  const clearLocalStorage = () => {
    redis.flushall()
    refreshInfo()
  }

  const clearSessionStorage = () => {
    sessionRedis.flushall()
    refreshInfo()
  }

  const deleteKey = (key: string, isSession = false) => {
    if (isSession) {
      sessionRedis.del(key)
    } else {
      redis.del(key)
    }
    refreshInfo()
  }

  const getTTL = (key: string, isSession = false) => {
    const ttl = isSession ? sessionRedis.ttl(key) : redis.ttl(key)
    if (ttl === -1) return "No expiration"
    if (ttl === -2) return "Expired/Not found"
    return `${ttl}s`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cache Manager</h2>
        <div className="flex gap-2">
          <Button onClick={refreshInfo} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearAllCache} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Storage Cache */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Database className="h-4 w-4 inline mr-2" />
              Local Storage Cache
            </CardTitle>
            <Button onClick={clearLocalStorage} variant="outline" size="sm">
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Keys:</span>
                <Badge variant="secondary">{cacheInfo.localStorage.keys}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Size:</span>
                <Badge variant="secondary">{cacheInfo.localStorage.size}</Badge>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {keys.local.map((key) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex-1 truncate">
                    <div className="font-mono">{key}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      TTL: {getTTL(key)}
                    </div>
                  </div>
                  <Button onClick={() => deleteKey(key)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {keys.local.length === 0 && <div className="text-center text-muted-foreground py-4">No cached items</div>}
            </div>
          </CardContent>
        </Card>

        {/* Session Storage Cache */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Database className="h-4 w-4 inline mr-2" />
              Session Storage Cache
            </CardTitle>
            <Button onClick={clearSessionStorage} variant="outline" size="sm">
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Keys:</span>
                <Badge variant="secondary">{cacheInfo.sessionStorage.keys}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Size:</span>
                <Badge variant="secondary">{cacheInfo.sessionStorage.size}</Badge>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {keys.session.map((key) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex-1 truncate">
                    <div className="font-mono">{key}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      TTL: {getTTL(key, true)}
                    </div>
                  </div>
                  <Button onClick={() => deleteKey(key, true)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {keys.session.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No cached items</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
