import { NextResponse } from "next/server"
import { fetchAITrendsCanada } from "@/lib/trends-client"

export async function GET() {
  try {
    const data = await fetchAITrendsCanada()

    if (!data) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/trends] Failed:", err)
    return NextResponse.json({ data: null })
  }
}
