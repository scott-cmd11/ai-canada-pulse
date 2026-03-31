// ONE-TIME admin route — DELETE THIS FILE after use
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DEEP_DIVE_INDEX_KEY = 'deepdive:index'

const SLUGS_TO_DELETE = [
  'global-ai-talent-joins-forces-in-canada-to-propel-venture-cr-2026-03-31',
  'nvidia-samsung-and-nasa-collaborate-with-axl-a-boost-for-can-2026-03-31',
]

function authorize(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch { return false }
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}

  for (const slug of SLUGS_TO_DELETE) {
    // Remove the post data
    await redis.del(`deepdive:${slug}`)

    // Remove from the sorted index — find and remove the matching member
    const all = await redis.zrange(DEEP_DIVE_INDEX_KEY, 0, -1)
    for (const member of all) {
      const entry = typeof member === 'string' ? JSON.parse(member) : member
      if (entry.slug === slug) {
        await redis.zrem(DEEP_DIVE_INDEX_KEY, member)
        break
      }
    }
    results[slug] = 'deleted'
  }

  return NextResponse.json({ ok: true, results })
}
