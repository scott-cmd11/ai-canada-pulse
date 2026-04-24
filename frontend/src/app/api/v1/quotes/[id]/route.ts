// Admin: edit a pending or approved quote (text, speaker, party, topics, etc.).

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/quotes/admin-auth"
import { editQuote } from "@/lib/quotes/supabase-quotes"
import { invalidateApprovedCache } from "@/lib/quotes/cache"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorised = requireAdmin(request)
  if (unauthorised) return unauthorised

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  const allowed = [
    "quote_text", "context_excerpt", "speaker_name", "speaker_role",
    "party", "chamber", "jurisdiction", "quote_date",
    "topics", "editor_notes", "language",
  ] as const
  for (const k of allowed) {
    if (k in body) patch[k] = body[k]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const updated = await editQuote(id, patch as Parameters<typeof editQuote>[1])
  if (!updated) {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 })
  }
  await invalidateApprovedCache()
  return NextResponse.json({ quote: updated })
}
