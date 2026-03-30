import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/utils/constants'

const CACHE_TTL = 30 * 60 * 1000 // 30 分钟

interface CacheEntry {
  value: number
  timestamp: number
}

function readCache(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GITHUB_STARS)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.value
    }
    localStorage.removeItem(STORAGE_KEYS.GITHUB_STARS)
  } catch {
    // ignore
  }
  return null
}

function writeCache(value: number): void {
  try {
    const entry: CacheEntry = { value, timestamp: Date.now() }
    localStorage.setItem(STORAGE_KEYS.GITHUB_STARS, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

export function useGitHubStars(repo: string): number | null {
  const [stars, setStars] = useState<number | null>(() => readCache())

  useEffect(() => {
    if (readCache() !== null) return

    const controller = new AbortController()

    fetch(`https://api.github.com/repos/${repo}`, {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const count = data.stargazers_count as number
        setStars(count)
        writeCache(count)
      })
      .catch(() => {
        // 静默失败，降级为仅显示图标
      })

    return () => controller.abort()
  }, [repo])

  return stars
}
