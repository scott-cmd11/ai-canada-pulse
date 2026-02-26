import { NextResponse } from "next/server"
import { indicators as fallbackIndicators } from "@/lib/indicators-data"
import { fetchAllIndicators } from "@/lib/statscan-client"

export async function GET() {
  try {
    const data = await fetchAllIndicators(fallbackIndicators)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch {
    // If everything fails, return mock data
    return NextResponse.json(fallbackIndicators)
  }
}
