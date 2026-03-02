import { NextResponse } from "next/server"
import { fetchAITrendsCanada } from "@/lib/trends-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await fetchAITrendsCanada()

    if (!data) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.warn("[api/trends] Failed:", err)
    return NextResponse.json({ data: null })
  }
}
