/**
 * Statistics Canada Adoption Data Client
 * Returns AI adoption rates by industry from the Canadian Survey on Business Conditions.
 * Source: Statistics Canada, Table 33-10-0001 (Q2 2025 release).
 *
 * NOTE: This data is curated from the Stats Canada publication — not fetched live.
 * The download endpoint (CSV/ZIP) is not parseable client-side and Stats Canada's
 * WDS JSON API requires server-side access to avoid CORS restrictions.
 *
 * TODO: If live data is needed, move this fetch to a Next.js API route at
 *       /api/v1/adoption and call the WDS endpoint:
 *       https://www150.statcan.gc.ca/t1/tbl1/en/dtl/getDataFromCubePidCoordAndLatestNPeriods/3310100001/{coord}/4
 *       You will need the specific MEMBERS/coordinates for AI adoption by NAICS sector.
 *
 * Refresh schedule: Stats Canada 33-10-0001 releases quarterly.
 * Last curated: Q2 2025 (verified March 2026).
 */

export interface IndustryAdoption {
    industry: string
    adoptionRate: number // percentage
}

export interface StatCanAdoptionData {
    industries: IndustryAdoption[]
    averageRate: number
    surveyPeriod: string
    fetchedAt: string
    isLive: boolean
}

export async function fetchStatCanAdoption(): Promise<StatCanAdoptionData> {
    return getCuratedAdoptionData()
}

/**
 * Curated AI adoption data from Statistics Canada's
 * Canadian Survey on Business Conditions (Table 33-10-0001, Q2 2025).
 * Figures represent the % of businesses in each sector that adopted AI.
 * Source: Statistics Canada, "Artificial intelligence and Canadian businesses" (11-621-m).
 */
function getCuratedAdoptionData(): StatCanAdoptionData {
    const industries: IndustryAdoption[] = [
        { industry: "Information & Cultural", adoptionRate: 35.6 },
        { industry: "Professional & Scientific", adoptionRate: 31.7 },
        { industry: "Finance & Insurance", adoptionRate: 30.6 },
        { industry: "Wholesale Trade", adoptionRate: 17.8 },
        { industry: "Manufacturing", adoptionRate: 15.2 },
        { industry: "Retail Trade", adoptionRate: 8.4 },
        { industry: "Transportation", adoptionRate: 7.1 },
        { industry: "Health Care", adoptionRate: 5.8 },
    ]

    const averageRate = industries.reduce((sum, i) => sum + i.adoptionRate, 0) / industries.length

    return {
        industries,
        averageRate: Math.round(averageRate * 10) / 10,
        surveyPeriod: "Q2 2025",
        fetchedAt: new Date().toISOString(),
        isLive: false,
    }
}
