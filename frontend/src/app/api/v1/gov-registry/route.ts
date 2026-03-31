import { NextResponse } from "next/server"
import { fetchGovAIRegistry } from "@/lib/gov-ai-registry-client"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const systems = await fetchGovAIRegistry()

    return NextResponse.json(
      { systems },
      {
        headers: {
          "Cache-Control": "public, max-age=43200, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/gov-registry] Failed:", err)
    return NextResponse.json({ systems: [] })
  }
}
