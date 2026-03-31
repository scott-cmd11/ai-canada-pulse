import { NextResponse } from "next/server"
import { fetchCanadianAIStocks, filterStocksByProvince } from "@/lib/stocks-client"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region')

  try {
    const data = await fetchCanadianAIStocks()
    const filtered = region && data ? filterStocksByProvince(data, region) : data
    const summary = await getSectionSummary('stocks')

    return NextResponse.json(
      { data: filtered, summary },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/stocks] Failed:", err)
    return NextResponse.json({ data: null, summary: null })
  }
}
