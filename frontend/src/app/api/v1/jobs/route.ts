import { NextResponse } from "next/server"
import { fetchAIJobMarket } from "@/lib/jobs-client"
import { getProvinceBySlug } from "@/lib/provinces-config"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  const { searchParams } = new URL(request.url)
  const regionSlug = searchParams.get('region')
  const province = regionSlug ? (getProvinceBySlug(regionSlug)?.name ?? regionSlug) : undefined

  try {
    const data = await fetchAIJobMarket(province)

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/jobs] Failed:", err)
    return NextResponse.json({ data: null })
  }
}
