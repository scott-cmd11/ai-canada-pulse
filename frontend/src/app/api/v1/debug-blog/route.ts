import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET() {
  try {
    const count = await redis.zcard('deepdive:index')
    const raw = await redis.zrange('deepdive:index', 0, -1, { rev: true })
    const slug1 = 'global-ai-expertise-joins-forces-with-axl-implications-for-c-2026-03-31'
    const slug2 = 'nvidia-samsung-and-nasa-collaborate-with-axl-a-boost-for-can-2026-03-31'
    const entry1 = await redis.exists(`deepdive:${slug1}`)
    const entry2 = await redis.exists(`deepdive:${slug2}`)
    return NextResponse.json({ count, raw, entry1exists: entry1, entry2exists: entry2 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
