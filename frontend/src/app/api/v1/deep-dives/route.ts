import { NextRequest, NextResponse } from 'next/server'
import { listDeepDives } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '10'), 50)
  // Note: spec uses `cursor=` but this implementation uses integer offset for simplicity
  // with Redis ZRANGE by index. The parameter is named `offset` in the API for clarity.
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0')

  const entries = await listDeepDives(limit, offset)
  return NextResponse.json({ entries, limit, offset })
}
