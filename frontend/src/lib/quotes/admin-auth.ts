// Shared admin-auth helper for the quotes review UI and admin API routes.
// Uses the same CRON_SECRET already wired in ai-refresh/route.ts to keep the
// operator surface small (one secret to rotate).

import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

/** Timing-safe compare between two strings (rejects length mismatches first). */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/**
 * Returns null if the request is authorised, or a 404 NextResponse if not.
 * We 404 (not 401) so the admin routes look like they don't exist to crawlers.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn("[quotes/admin-auth] CRON_SECRET is not set — denying all admin access")
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(request.url)
  const keyFromQuery = url.searchParams.get("key")
  if (keyFromQuery && safeEqual(keyFromQuery, secret)) return null

  // Also accept Bearer token — same secret — for the cron path.
  const auth = request.headers.get("authorization") ?? ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (bearer && safeEqual(bearer, secret)) return null

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

/** Server-side check usable from page.tsx (returns boolean, no Response). */
export function isAdminKeyValid(key: string | undefined | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !key) return false
  return safeEqual(key, secret)
}
