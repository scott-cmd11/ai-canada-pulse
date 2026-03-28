import { NextResponse } from "next/server"
import { fetchNSERCData } from "@/lib/nserc-client"

export async function GET() {
  try {
    const data = await fetchNSERCData()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/nserc] Failed:", err)
    return NextResponse.json({ grants: [], totalFunding: 0, grantCount: 0, topInstitutions: [] })
  }
}
