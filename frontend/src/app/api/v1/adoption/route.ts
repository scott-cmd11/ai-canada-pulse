import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { fetchStatCanAdoption } from "@/lib/statcan-sdmx-client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, "loose")
  if (limited) return limited

  try {
    const data = await fetchStatCanAdoption()
    return NextResponse.json(
      { data, sourceHealth: data.sourceHealth },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/adoption] Failed:", err)
    return NextResponse.json({ data: null, sourceHealth: [] }, { status: 502 })
  }
}
