import { NextResponse } from "next/server"
import { fetchCanadianAIStocks } from "@/lib/stocks-client"

export async function GET() {
  try {
    const data = await fetchCanadianAIStocks()

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=600",
        },
      }
    )
  } catch {
    return NextResponse.json({ data: null })
  }
}
