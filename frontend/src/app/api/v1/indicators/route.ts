import { NextResponse } from "next/server"
import { indicators } from "@/lib/indicators-data"
import { fetchAllIndicators } from "@/lib/statscan-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await fetchAllIndicators(indicators)

    return NextResponse.json(data)
  } catch (err) {
    console.warn("[api/indicators] Failed:", err)
    // If Stats Canada API is down, return indicators with empty data arrays
    return NextResponse.json(indicators)
  }
}
