import { NextResponse } from "next/server"
import { fetchGovAIRegistry } from "@/lib/gov-ai-registry-client"

export async function GET() {
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
  } catch {
    return NextResponse.json({ systems: [] })
  }
}
