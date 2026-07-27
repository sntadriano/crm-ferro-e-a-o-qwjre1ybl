import { useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 5 * 60 * 1000

export function clearListCache(): void {
  cache.clear()
}

export function useListCache<T>() {
  const getCacheKey = useCallback((route: string, params: Record<string, unknown>): string => {
    return `${route}:${JSON.stringify(params)}`
  }, [])

  const getCached = useCallback((key: string): T | null => {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(key)
      return null
    }
    return entry.data as T
  }, [])

  const setCached = useCallback((key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() })
  }, [])

  return { getCacheKey, getCached, setCached }
}
