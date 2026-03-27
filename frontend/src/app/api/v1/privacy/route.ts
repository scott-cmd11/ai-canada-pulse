import { NextResponse } from "next/server"
import { fetchOPCData } from "@/lib/opc-client"

export async function GET() {
  try {
    const data = await fetchOPCData()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch (err) {
    console.warn("[api/privacy] Failed:", err)
    return NextResponse.json({ decisions: [], totalDecisions: 0, lastUpdated: "" })
  }
}
