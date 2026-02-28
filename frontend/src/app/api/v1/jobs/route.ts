import { NextResponse } from "next/server"
import { fetchAIJobMarket } from "@/lib/jobs-client"

export async function GET() {
  try {
    const data = await fetchAIJobMarket()

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/jobs] Failed:", err)
    return NextResponse.json({ data: null })
  }
}
