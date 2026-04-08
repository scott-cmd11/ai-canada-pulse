import { NextResponse, type NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-canada-pulse.vercel.app'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/subscribe/confirmed`)
  }

  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase
        .from('subscribers')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('confirmation_token', token)
        .eq('status', 'pending')
    } catch (err) {
      console.error('[confirm] Error:', err)
    }
  }

  // Always redirect to success page (no error leakage)
  return NextResponse.redirect(`${SITE_URL}/subscribe/confirmed`)
}
