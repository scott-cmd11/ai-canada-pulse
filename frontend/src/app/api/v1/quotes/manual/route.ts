// Admin: manually submit a curated quote. Auto-approved, bypasses the LLM
// classifier entirely — intended for quotes the operator has hand-verified.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/quotes/admin-auth"
import { insertManualApproved } from "@/lib/quotes/supabase-quotes"
import { invalidateApprovedCache } from "@/lib/quotes/cache"
import type { QuoteCandidate, QuoteChamber, QuoteJurisdiction, QuoteLanguage } from "@/lib/quotes/types"

const JURISDICTIONS: QuoteJurisdiction[] = ["federal", "on", "qc", "bc", "ab"]
const CHAMBERS: QuoteChamber[] = ["house", "senate", "provincial_legislature", "executive"]

export async function POST(request: Request) {
  const unauthorised = requireAdmin(request)
  if (unauthorised) return unauthorised

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const speaker_name = typeof body.speaker_name === "string" ? body.speaker_name.trim() : ""
  const quote_text = typeof body.quote_text === "string" ? body.quote_text.trim() : ""
  const jurisdiction = typeof body.jurisdiction === "string" && JURISDICTIONS.includes(body.jurisdiction as QuoteJurisdiction)
    ? (body.jurisdiction as QuoteJurisdiction)
    : null

  if (!speaker_name || !quote_text || !jurisdiction) {
    return NextResponse.json(
      { error: "speaker_name, quote_text, and jurisdiction are required" },
      { status: 400 }
    )
  }

  const candidate: QuoteCandidate = {
    source_type: "manual",
    source_url: typeof body.source_url === "string" ? body.source_url : null,
    speaker_name,
    speaker_role: typeof body.speaker_role === "string" ? body.speaker_role : null,
    party: typeof body.party === "string" ? body.party : null,
    chamber: CHAMBERS.includes(body.chamber as QuoteChamber) ? (body.chamber as QuoteChamber) : null,
    jurisdiction,
    quote_date: typeof body.quote_date === "string" ? body.quote_date : null,
    quote_text,
    context_excerpt: typeof body.context_excerpt === "string" ? body.context_excerpt : null,
    topics: Array.isArray(body.topics) ? body.topics.filter((t: unknown) => typeof t === "string").slice(0, 4) : [],
    language: body.language === "fr" ? ("fr" as QuoteLanguage) : ("en" as QuoteLanguage),
  }

  const inserted = await insertManualApproved(candidate)
  if (!inserted) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 })
  }
  await invalidateApprovedCache()
  return NextResponse.json({ quote: inserted })
}
