import { NextResponse } from "next/server"
import { fetchCanadianAIResearch } from "@/lib/research-client"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'standard')
  if (limited) return limited

  try {
    const result = await fetchCanadianAIResearch()
    const summary = await getSectionSummary('research')

    return NextResponse.json({
      papers: result.papers,
      fetchedAt: result.fetchedAt,
      summary,
    })
  } catch (err) {
    console.warn("[api/research] Failed:", err)
    return NextResponse.json({ papers: [], fetchedAt: null, summary: null })
  }
}
