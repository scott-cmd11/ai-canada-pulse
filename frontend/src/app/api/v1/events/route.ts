import { NextResponse } from "next/server"
import { fetchEventsData } from "@/lib/events-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get("region") || undefined

    const data = await fetchEventsData(region)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=43200, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/events] Failed:", err)
    return NextResponse.json({ events: [], upcoming: [], totalEvents: 0, stats: { total: 0, byType: {}, byProvince: {} }, lastUpdated: "" })
  }
}
