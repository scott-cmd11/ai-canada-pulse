import { NextResponse } from "next/server"
import { fetchCanadianAIResearch } from "@/lib/research-client"

export async function GET() {
  try {
    const papers = await fetchCanadianAIResearch()

    return NextResponse.json(
      { papers },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/research] Failed:", err)
    return NextResponse.json({ papers: [] })
  }
}
