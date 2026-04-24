// Admin: reject a pending quote.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/quotes/admin-auth"
import { updateStatus } from "@/lib/quotes/supabase-quotes"
import { invalidateApprovedCache } from "@/lib/quotes/cache"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorised = requireAdmin(request)
  if (unauthorised) return unauthorised

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const notes = typeof body?.notes === "string" ? body.notes : undefined

  const updated = await updateStatus(id, "rejected", notes)
  if (!updated) {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 })
  }
  // Rejection can also require invalidating if the quote was previously approved.
  await invalidateApprovedCache()
  return NextResponse.json({ quote: updated })
}
