// frontend/src/lib/email.ts
// Resend wrapper for transactional and bulk emails.
// Plain HTML templates — no React Email dependency.

import { Resend } from 'resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-canada-pulse.vercel.app'
const FROM_ADDRESS = 'AI Canada Pulse <hello@aicanadapulse.ca>'

let resendClient: Resend | null = null

function getResend(): Resend | null {
  if (resendClient) return resendClient
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  resendClient = new Resend(key)
  return resendClient
}

// ─── CASL-compliant footer (included in every email) ─────────────────────────

function emailFooter(unsubscribeUrl: string): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #888; line-height: 1.6;">
      <p>AI Canada Pulse · Winnipeg, MB, Canada</p>
      <p>A personal project by Scott Hazlitt tracking AI developments in Canada.</p>
      <p><a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a> · <a href="${SITE_URL}/legal" style="color: #888;">Privacy Policy</a></p>
    </div>
  `
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; padding: 32px 20px; background: #ffffff;">
    ${content}
  </div>
</body>
</html>`
}

// ─── Confirmation email (double opt-in) ──────────────────────────────────────

export async function sendConfirmationEmail(
  email: string,
  confirmationToken: string,
  unsubscribeToken: string
): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] No RESEND_API_KEY configured')
    return false
  }

  const confirmUrl = `${SITE_URL}/api/v1/confirm?token=${confirmationToken}`
  const unsubscribeUrl = `${SITE_URL}/api/v1/unsubscribe?token=${unsubscribeToken}`

  const html = emailWrapper(`
    <div style="padding-bottom: 20px; margin-bottom: 24px; border-bottom: 2px solid #c45d3e;">
      <a href="${SITE_URL}" style="text-decoration: none;">
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #c45d3e;">AI Canada Pulse</span>
      </a>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">
      Confirm your subscription
    </h1>
    <p style="font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 24px;">
      You requested to receive a weekly summary of Canadian AI developments every Monday. Your email will only be used for this newsletter — it is never shared, sold, or used for any other purpose. You can unsubscribe instantly from any email.
    </p>
    <a href="${confirmUrl}" style="display: inline-block; padding: 12px 28px; background-color: #c45d3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
      Confirm Subscription
    </a>
    <p style="font-size: 13px; color: #888; margin-top: 24px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. No further emails will be sent without your confirmation.
    </p>
    ${emailFooter(unsubscribeUrl)}
  `)

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Confirm your AI Canada Pulse subscription',
      html,
    })
    if (error) {
      console.error('[email] Failed to send confirmation:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] Error sending confirmation:', err)
    return false
  }
}

// ─── Weekly digest email ─────────────────────────────────────────────────────

export interface WeeklyTopStory {
  headline: string
  summary: string
  url: string
  source: string
}

export interface WeeklyEmailData {
  headline: string
  intro: string
  dominantTheme: string // e.g. "Regulatory momentum" — explains why this theme was chosen
  developments: string[]
  topStories: WeeklyTopStory[]
  weekRange: string // e.g. "March 31 – April 6, 2026"
}

export async function sendWeeklyDigestBatch(
  subscribers: Array<{ email: string; unsubscribeToken: string }>,
  data: WeeklyEmailData
): Promise<{ sent: number; failed: number }> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] No RESEND_API_KEY configured')
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  // Send individually so each has a unique unsubscribe link
  for (const sub of subscribers) {
    const unsubscribeUrl = `${SITE_URL}/api/v1/unsubscribe?token=${sub.unsubscribeToken}`

    const developmentsList = data.developments
      .map(d => `<li style="margin-bottom: 8px;">${d}</li>`)
      .join('')

    const topStoriesHtml = data.topStories.length > 0
      ? `
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 16px;">
            Top Stories This Week
          </p>
          ${data.topStories.map(story => `
            <div style="margin-bottom: 20px;">
              <a href="${story.url}" style="font-size: 15px; font-weight: 600; color: #c45d3e; text-decoration: none; line-height: 1.4;">
                ${story.headline}
              </a>
              <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 4px 0 0;">
                ${story.summary}
              </p>
              <p style="font-size: 11px; color: #999; margin: 4px 0 0;">
                ${story.source}
              </p>
            </div>
          `).join('')}
        </div>
      `
      : ''

    const html = emailWrapper(`
      <div style="padding-bottom: 20px; margin-bottom: 24px; border-bottom: 2px solid #c45d3e;">
        <a href="${SITE_URL}" style="text-decoration: none;">
          <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #c45d3e;">AI Canada Pulse</span>
        </a>
      </div>
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c45d3e; margin-bottom: 8px;">
        WEEKLY BRIEFING · ${data.weekRange}
      </p>
      <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">
        ${data.headline}
      </h1>
      <p style="font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 6px;">
        ${data.intro}
      </p>
      <p style="font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 24px; font-style: italic;">
        This week's dominant theme: ${data.dominantTheme}
      </p>
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 12px;">
        Key Developments
      </p>
      <ul style="padding-left: 20px; font-size: 14px; color: #333; line-height: 1.7;">
        ${developmentsList}
      </ul>
      ${topStoriesHtml}
      <div style="margin-top: 28px;">
        <a href="${SITE_URL}" style="display: inline-block; padding: 10px 24px; background-color: #c45d3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">
          View Full Dashboard
        </a>
      </div>
      <p style="font-size: 11px; color: #aaa; margin-top: 20px;">
        AI-generated summary · may contain errors · verify with linked sources
      </p>
      ${emailFooter(unsubscribeUrl)}
    `)

    try {
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: sub.email,
        subject: `${data.headline} — AI Canada Pulse Weekly`,
        html,
      })
      if (error) {
        console.error(`[email] Failed to send to ${sub.email}:`, error)
        failed++
      } else {
        sent++
      }
    } catch (err) {
      console.error(`[email] Error sending to ${sub.email}:`, err)
      failed++
    }
  }

  return { sent, failed }
}
