// Public read API for the approved quotes list.
// Upstash cache first, Supabase fallback on miss. Filters applied server-side.

import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { listApproved } from "@/lib/quotes/supabase-quotes"
import { readApprovedCache, writeApprovedCache } from "@/lib/quotes/cache"
import type { Quote, QuoteChamber, QuoteJurisdiction } from "@/lib/quotes/types"

function applyFilters(
  quotes: Quote[],
  filters: {
    party?: string
    chamber?: string
    jurisdiction?: string
    year?: number
    topic?: string
    q?: string
  }
): Quote[] {
  return quotes.filter((q) => {
    if (filters.party && q.party !== filters.party) return false
    if (filters.chamber && q.chamber !== filters.chamber) return false
    if (filters.jurisdiction && q.jurisdiction !== filters.jurisdiction) return false
    if (filters.year && (!q.quote_date || !q.quote_date.startsWith(String(filters.year)))) return false
    if (filters.topic && !(q.topics ?? []).includes(filters.topic)) return false
    if (filters.q) {
      const needle = filters.q.toLowerCase()
      const hay = `${q.quote_text} ${q.speaker_name}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, "loose")
  if (limited) return limited

  const url = new URL(request.url)
  const filters = {
    party:        url.searchParams.get("party") ?? undefined,
    chamber:      (url.searchParams.get("chamber") as QuoteChamber | null) ?? undefined,
    jurisdiction: (url.searchParams.get("jurisdiction") as QuoteJurisdiction | null) ?? undefined,
    year:         url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined,
    topic:        url.searchParams.get("topic") ?? undefined,
    q:            url.searchParams.get("q") ?? undefined,
  }
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 50))

  try {
    let all = await readApprovedCache()
    let cacheHit = true
    if (!all) {
      cacheHit = false
      all = await listApproved({ limit: 500 })
      if (all.length > 0) {
        await writeApprovedCache(all)
      }
    }

    const filtered = applyFilters(all, filters)
    const data = filtered.slice(0, limit)

    return NextResponse.json(
      {
        data,
        totalMatching: filtered.length,
        totalApproved: all.length,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "X-Cache": cacheHit ? "HIT" : "MISS",
        },
      }
    )
  } catch (err) {
    console.warn("[api/quotes] failed:", err)
    return NextResponse.json({ data: [], totalMatching: 0, totalApproved: 0 })
  }
}
