import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  // Strict rate limit — this triggers an email send
  const limited = await checkRateLimit(request, 'strict')
  if (limited) return limited

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: 'Subscription service unavailable' },
      { status: 503 }
    )
  }

  let email: string
  try {
    const body = await request.json()
    email = (body.email || '').trim().toLowerCase()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid request' },
      { status: 400 }
    )
  }

  if (!email || !EMAIL_REGEX.test(email) || email.length > 320) {
    return NextResponse.json(
      { ok: false, message: 'Please enter a valid email address' },
      { status: 400 }
    )
  }

  // Generic success message for all outcomes (prevents email enumeration)
  const successResponse = NextResponse.json({
    ok: true,
    message: 'Check your email to confirm your subscription',
  })

  try {
    // Check for existing subscriber
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status, confirmation_token, unsubscribe_token')
      .eq('email', email)
      .single()

    if (existing) {
      if (existing.status === 'confirmed') {
        // Already subscribed — return generic success (no leakage)
        return successResponse
      }

      if (existing.status === 'pending') {
        // Resend confirmation with existing tokens
        await sendConfirmationEmail(email, existing.confirmation_token, existing.unsubscribe_token)
        return successResponse
      }

      if (existing.status === 'unsubscribed') {
        // Re-subscribe: reset to pending with new tokens
        const { data: updated } = await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            confirmation_token: crypto.randomUUID(),
            unsubscribe_token: crypto.randomUUID(),
            unsubscribed_at: null,
            confirmed_at: null,
          })
          .eq('id', existing.id)
          .select('confirmation_token, unsubscribe_token')
          .single()

        if (updated) {
          await sendConfirmationEmail(email, updated.confirmation_token, updated.unsubscribe_token)
        }
        return successResponse
      }
    }

    // New subscriber
    const confirmationToken = crypto.randomUUID()
    const unsubscribeToken = crypto.randomUUID()
    const { data: newSub } = await supabase
      .from('subscribers')
      .insert({ email, confirmation_token: confirmationToken, unsubscribe_token: unsubscribeToken })
      .select('confirmation_token, unsubscribe_token')
      .single()

    if (newSub) {
      await sendConfirmationEmail(email, newSub.confirmation_token, newSub.unsubscribe_token)
    }

    return successResponse
  } catch (err) {
    console.error('[subscribe] Error:', err)
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
