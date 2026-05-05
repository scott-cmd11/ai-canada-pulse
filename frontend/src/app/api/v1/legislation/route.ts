import { NextResponse } from "next/server"
import { fetchLegislationData } from "@/lib/legisinfo-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const data = await fetchLegislationData()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=43200, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/legislation] Failed:", err)
    return NextResponse.json({ bills: [], totalAIBills: 0, lastUpdated: "" })
  }
}
