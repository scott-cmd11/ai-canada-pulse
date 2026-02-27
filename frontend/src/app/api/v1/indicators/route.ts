import { NextResponse } from "next/server"
import { indicators } from "@/lib/indicators-data"
import { fetchAllIndicators } from "@/lib/statscan-client"

export async function GET() {
  try {
    const data = await fetchAllIndicators(indicators)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
      },
    })
  } catch {
    // If Stats Canada API is down, return indicators with empty data arrays
    return NextResponse.json(indicators)
  }
}
