import { NextResponse } from "next/server"
import { fetchParliamentAIMentions } from "@/lib/parliament-client"

export async function GET() {
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
  } catch {
    return NextResponse.json({ data: { mentions: [], totalCount: 0 } })
  }
}
