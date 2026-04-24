// Upstash read-through cache for the approved-quotes list.
// Invalidated whenever a quote is approved, rejected, or edited.
// Mirrors the pattern in ai-enrichment-cache.ts.

import { Redis } from "@upstash/redis"
import type { Quote } from "./types"

const CACHE_KEY = "quotes:approved:v1"
const CACHE_TTL_SECONDS = 24 * 60 * 60

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function readApprovedCache(): Promise<Quote[] | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    return (await redis.get<Quote[]>(CACHE_KEY)) ?? null
  } catch (err) {
    console.warn("[quotes/cache] read failed:", err)
    return null
  }
}

export async function writeApprovedCache(quotes: Quote[]): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(CACHE_KEY, quotes, { ex: CACHE_TTL_SECONDS })
  } catch (err) {
    console.warn("[quotes/cache] write failed:", err)
  }
}

export async function invalidateApprovedCache(): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(CACHE_KEY)
  } catch (err) {
    console.warn("[quotes/cache] invalidate failed:", err)
  }
}
