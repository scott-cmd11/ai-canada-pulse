import { NextResponse } from "next/server"
import { fetchStartupSignals } from "@/lib/startup-signals-client"

export async function GET() {
  try {
    const data = await fetchStartupSignals()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/startups] Failed:", err)
    return NextResponse.json({ signals: [], totalSignals: 0, lastUpdated: "" })
  }
}
