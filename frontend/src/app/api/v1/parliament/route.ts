import { NextResponse } from "next/server"
import { fetchParliamentAIMentions } from "@/lib/parliament-client"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const data = await fetchParliamentAIMentions()
    const summary = await getSectionSummary('parliament')

    return NextResponse.json(
      { data, summary },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/parliament] Failed:", err)
    return NextResponse.json({ data: { mentions: [], totalCount: 0 }, summary: null })
  }
}
