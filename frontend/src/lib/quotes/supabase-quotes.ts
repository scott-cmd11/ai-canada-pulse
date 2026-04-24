// CRUD layer over the `quotes` Supabase table.
// Reuses getSupabase() from lib/supabase.ts; all server-side (service role key).

import { createHash } from "node:crypto"
import { getSupabase } from "@/lib/supabase"
import type {
  Quote,
  QuoteCandidate,
  QuoteFilters,
  QuoteStatus,
} from "./types"

const TABLE = "quotes"

/** Stable dedup hash — prevents re-ingesting the same quote across cron runs. */
export function dedupHash(sourceUrl: string | null, quoteText: string): string {
  return createHash("sha256")
    .update(`${sourceUrl ?? ""}::${quoteText.slice(0, 200)}`)
    .digest("hex")
}

/**
 * Insert a batch of candidate quotes. Ignores rows that collide on dedup_hash
 * (i.e. already seen). Returns count of newly inserted rows.
 */
export async function insertCandidates(
  candidates: QuoteCandidate[]
): Promise<number> {
  const supabase = getSupabase()
  if (!supabase || candidates.length === 0) return 0

  const rows = candidates.map((c) => ({
    source_type:     c.source_type,
    source_url:      c.source_url,
    speaker_name:    c.speaker_name,
    speaker_role:    c.speaker_role,
    party:           c.party,
    chamber:         c.chamber,
    jurisdiction:    c.jurisdiction,
    quote_date:      c.quote_date,
    quote_text:      c.quote_text,
    context_excerpt: c.context_excerpt,
    topics:          c.topics,
    language:        c.language,
    status:          "pending" as QuoteStatus,
    dedup_hash:      dedupHash(c.source_url, c.quote_text),
  }))

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "dedup_hash", ignoreDuplicates: true })
    .select("id")

  if (error) {
    console.warn("[quotes/supabase] insertCandidates failed:", error.message)
    return 0
  }
  return data?.length ?? 0
}

/** Manual-submission shortcut: insert a single quote with status=approved. */
export async function insertManualApproved(
  candidate: QuoteCandidate
): Promise<Quote | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const row = {
    source_type:     candidate.source_type,
    source_url:      candidate.source_url,
    speaker_name:    candidate.speaker_name,
    speaker_role:    candidate.speaker_role,
    party:           candidate.party,
    chamber:         candidate.chamber,
    jurisdiction:    candidate.jurisdiction,
    quote_date:      candidate.quote_date,
    quote_text:      candidate.quote_text,
    context_excerpt: candidate.context_excerpt,
    topics:          candidate.topics,
    language:        candidate.language,
    status:          "approved" as QuoteStatus,
    reviewed_at:     new Date().toISOString(),
    dedup_hash:      dedupHash(candidate.source_url, candidate.quote_text),
  }
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "dedup_hash" })
    .select()
    .single()

  if (error) {
    console.warn("[quotes/supabase] insertManualApproved failed:", error.message)
    return null
  }
  return data as Quote
}

export async function listApproved(filters: QuoteFilters = {}): Promise<Quote[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  let q = supabase
    .from(TABLE)
    .select("*")
    .eq("status", "approved")
    .order("quote_date", { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 500)

  if (filters.party)        q = q.eq("party", filters.party)
  if (filters.chamber)      q = q.eq("chamber", filters.chamber)
  if (filters.jurisdiction) q = q.eq("jurisdiction", filters.jurisdiction)
  if (filters.topic)        q = q.contains("topics", [filters.topic])
  if (filters.year) {
    q = q
      .gte("quote_date", `${filters.year}-01-01`)
      .lte("quote_date", `${filters.year}-12-31`)
  }
  if (filters.q) {
    // Simple ilike over speaker + text; good enough for an archive this size.
    q = q.or(`quote_text.ilike.%${filters.q}%,speaker_name.ilike.%${filters.q}%`)
  }

  const { data, error } = await q
  if (error) {
    console.warn("[quotes/supabase] listApproved failed:", error.message)
    return []
  }
  return (data ?? []) as Quote[]
}

export async function listPending(): Promise<Quote[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(200)
  if (error) {
    console.warn("[quotes/supabase] listPending failed:", error.message)
    return []
  }
  return (data ?? []) as Quote[]
}

export async function listRecentReviewed(limit = 20): Promise<Quote[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) {
    console.warn("[quotes/supabase] listRecentReviewed failed:", error.message)
    return []
  }
  return (data ?? []) as Quote[]
}

export async function updateStatus(
  id: string,
  status: QuoteStatus,
  editorNotes?: string
): Promise<Quote | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      ...(editorNotes !== undefined ? { editor_notes: editorNotes } : {}),
    })
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.warn(`[quotes/supabase] updateStatus(${id}) failed:`, error.message)
    return null
  }
  return data as Quote
}

export async function editQuote(
  id: string,
  patch: Partial<Pick<
    Quote,
    | "quote_text"
    | "context_excerpt"
    | "speaker_name"
    | "speaker_role"
    | "party"
    | "chamber"
    | "jurisdiction"
    | "quote_date"
    | "topics"
    | "editor_notes"
    | "language"
  >>
): Promise<Quote | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.warn(`[quotes/supabase] editQuote(${id}) failed:`, error.message)
    return null
  }
  return data as Quote
}
