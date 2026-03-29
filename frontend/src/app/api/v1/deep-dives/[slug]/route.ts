import { NextRequest, NextResponse } from 'next/server'
import { getDeepDive } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await getDeepDive(params.slug)
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ post })
}
