// frontend/src/lib/rate-limit.ts
// Tiered rate limiting using Upstash Redis + @upstash/ratelimit.
// Three tiers based on downstream cost:
//   strict   — 10 req/min  (routes that can trigger OpenAI calls)
//   standard — 60 req/min  (routes with external free APIs)
//   loose    — 120 req/min (heavily cached or static-data routes)
//
// Returns null (allow) when Redis credentials are absent — safe during
// Next.js static build prerendering and local dev without env vars.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

export type RateLimitTier = 'strict' | 'standard' | 'loose'

type Limiters = Record<RateLimitTier, Ratelimit>

// Lazily initialised — only created when Redis credentials are present.
let limiters: Limiters | null = null

function getLimiters(): Limiters | null {
  if (limiters) return limiters
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  // Sliding window prevents burst-doubling at window boundaries.
  limiters = {
    strict:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10,  '1 m'), prefix: 'rl:strict',   analytics: false }),
    standard: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60,  '1 m'), prefix: 'rl:standard', analytics: false }),
    loose:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, '1 m'), prefix: 'rl:loose',    analytics: false }),
  }
  return limiters
}

/** Extract the client IP from Vercel/Next.js request headers. */
function getClientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'anonymous'
  )
}

/**
 * Check the rate limit for a request.
 * Returns a 429 NextResponse if the limit is exceeded, null if allowed.
 *
 * Usage:
 *   const limited = await checkRateLimit(request, 'standard')
 *   if (limited) return limited
 */
export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier = 'standard'
): Promise<NextResponse | null> {
  const l = getLimiters()
  if (!l) return null // no Redis — allow through (build time / missing env)

  const ip = getClientIp(request)
  let result: Awaited<ReturnType<Ratelimit["limit"]>>
  try {
    result = await l[tier].limit(ip)
  } catch (err) {
    console.warn(`[rate-limit] ${tier} limiter unavailable; allowing request:`, err)
    return null
  }

  const { success, limit, reset } = result

  if (!success) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    })
  }

  return null
}
