import { NextResponse } from "next/server"
import { fetchCanadianAIResearch } from "@/lib/research-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const result = await fetchCanadianAIResearch()

    return NextResponse.json({
      papers: result.papers,
      fetchedAt: result.fetchedAt,
    })
  } catch (err) {
    console.warn("[api/research] Failed:", err)
    return NextResponse.json({ papers: [], fetchedAt: null })
  }
}
