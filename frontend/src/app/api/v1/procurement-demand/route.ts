import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { fetchProcurementDemand } from "@/lib/procurement-demand-client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, "loose")
  if (limited) return limited

  try {
    const data = await fetchProcurementDemand()
    return NextResponse.json(
      data,
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/procurement-demand] Failed:", err)
    return NextResponse.json({ signals: [], tenderCount: 0, contractSampleCount: 0, sourceHealth: [] }, { status: 502 })
  }
}
