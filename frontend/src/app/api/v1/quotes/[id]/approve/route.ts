// Admin: approve a pending quote. Invalidates the public cache.

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
  const updated = await updateStatus(id, "approved")
  if (!updated) {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 })
  }
  await invalidateApprovedCache()
  return NextResponse.json({ quote: updated })
}
