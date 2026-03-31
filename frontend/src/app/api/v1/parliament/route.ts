import { NextResponse } from "next/server"
import { fetchParliamentAIMentions } from "@/lib/parliament-client"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const data = await fetchParliamentAIMentions()

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/parliament] Failed:", err)
    return NextResponse.json({ data: { mentions: [], totalCount: 0 } })
  }
}
