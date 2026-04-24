// Cron-triggered ingest: runs every source scraper, classifies candidates
// through OpenAI, and upserts pending rows into Supabase.
// Guarded by the shared CRON_SECRET via Bearer token.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/quotes/admin-auth"
import { runIngest } from "@/lib/quotes/ingest"

// Allow up to 5 minutes — provincial scrapers + LLM classification add up.
export const maxDuration = 300

export async function GET(request: Request) {
  const unauthorised = requireAdmin(request)
  if (unauthorised) return unauthorised

  try {
    const report = await runIngest()
    return NextResponse.json({ ok: true, report })
  } catch (err) {
    console.warn("[api/quotes/ingest] failed:", err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
