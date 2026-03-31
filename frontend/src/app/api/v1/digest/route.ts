import { NextRequest, NextResponse } from 'next/server'
import { getDigest } from '@/lib/digest-client'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  const date =
    request.nextUrl.searchParams.get('date') ??
    new Date().toISOString().split('T')[0]

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
  }

  const digest = await getDigest(date)
  if (!digest) {
    return NextResponse.json({ digest: null, state: 'pending' }, { status: 200 })
  }
  if (digest.error) {
    return NextResponse.json({ digest: null, state: 'error' }, { status: 200 })
  }

  return NextResponse.json({ digest, state: 'ready' })
}
