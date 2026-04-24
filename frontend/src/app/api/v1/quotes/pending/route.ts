// Admin: list pending + recently-reviewed quotes for the review queue.

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/quotes/admin-auth"
import { listPending, listRecentReviewed } from "@/lib/quotes/supabase-quotes"

export async function GET(request: Request) {
  const unauthorised = requireAdmin(request)
  if (unauthorised) return unauthorised

  const [pending, recentReviewed] = await Promise.all([
    listPending(),
    listRecentReviewed(20),
  ])

  return NextResponse.json({ pending, recentReviewed })
}
