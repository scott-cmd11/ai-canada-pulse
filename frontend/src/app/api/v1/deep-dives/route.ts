import { NextRequest, NextResponse } from 'next/server'
import { listDeepDives } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10)
  const rawOffset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10)
  // Note: spec uses `cursor=` but this implementation uses integer offset for simplicity
  // with Redis ZRANGE by index. The parameter is named `offset` in the API for clarity.
  const limit = Math.min(Number.isNaN(rawLimit) ? 10 : rawLimit, 50)
  const offset = Number.isNaN(rawOffset) ? 0 : rawOffset

  const entries = await listDeepDives(limit, offset)
  return NextResponse.json({ entries, limit, offset })
}
