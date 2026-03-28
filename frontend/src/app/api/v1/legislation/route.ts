import { NextResponse } from "next/server"
import { fetchLegislationData } from "@/lib/legisinfo-client"

export async function GET() {
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
