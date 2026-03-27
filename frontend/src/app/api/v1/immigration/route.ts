import { NextResponse } from "next/server"
import { fetchImmigrationData } from "@/lib/ircc-client"

export async function GET() {
  try {
    const data = await fetchImmigrationData()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/immigration] Failed:", err)
    return NextResponse.json({ techWorkPermits: [], expressEntry: [], totalTechWorkers: 0, growthRate: 0, lastUpdated: "" })
  }
}
