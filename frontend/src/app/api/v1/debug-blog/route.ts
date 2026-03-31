// Temporary diagnostic route — shows raw Redis state for deep-dive index
// DELETE this file after diagnosing the blog issue
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DEEP_DIVE_INDEX_KEY = 'deepdive:index'

export async function GET() {
  try {
    const count = await redis.zcard(DEEP_DIVE_INDEX_KEY)
    const raw = await redis.zrange(DEEP_DIVE_INDEX_KEY, 0, -1, { rev: true })
    const rawForward = await redis.zrange(DEEP_DIVE_INDEX_KEY, 0, -1)

    // Also try fetching the known slug directly
    const knownSlug = 'nvidia-samsung-and-nasa-collaborate-with-axl-a-boost-for-can-2026-03-31'
    const directEntry = await redis.get(`deepdive:${knownSlug}`)

    return NextResponse.json({
      indexKey: DEEP_DIVE_INDEX_KEY,
      entryCount: count,
      rawReversed: raw,
      rawForward: rawForward,
      directEntryExists: !!directEntry,
      directEntryTitle: (directEntry as { title?: string })?.title ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
