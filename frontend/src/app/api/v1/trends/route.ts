import { NextResponse } from "next/server"
import { fetchAITrendsCanada } from "@/lib/trends-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
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
