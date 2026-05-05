import { NextResponse } from "next/server"
import { fetchGovAIRegistry } from "@/lib/gov-ai-registry-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  try {
    const data = await fetchGovAIRegistry()

    return NextResponse.json(
      data,
      {
        headers: {
          "Cache-Control": "public, max-age=43200, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/gov-registry] Failed:", err)
    return NextResponse.json(
      {
        systems: [],
        total: 0,
        inProduction: 0,
        inDevelopment: 0,
        retired: 0,
        publicFacing: 0,
        employeeFacing: 0,
        sourceUrl: "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b",
        resourceUrl: null,
        resourceName: null,
        fetchedAt: new Date().toISOString(),
        sourceHealth: [
          {
            id: "gc-ai-register",
            label: "Government of Canada AI Register",
            status: "fallback",
            sourceUrl: "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b",
            fetchedAt: new Date().toISOString(),
            note: "AI Register endpoint failed; no register entries are being claimed.",
          },
        ],
      },
      { status: 502 }
    )
  }
}
