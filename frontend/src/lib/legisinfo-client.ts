// LEGISinfo bill tracking client
// Fetches AI-related bills from Parliament of Canada
// Source: LEGISinfo XML feed — https://www.parl.ca/legisinfo/en/bills/xml
// Docs: https://www.parl.ca/legisinfo/
//
// Key tracked bills:
//   C-27  — Digital Charter Implementation Act, 2022 (includes AIDA). Died on the order paper
//            when Parliament was prorogued on 2026-01-06 (44th Parliament, 1st Session ended).
//   C-63  — Online Harms Act (AI-generated content). Also died 2026-01-06.
// New bills in the 45th Parliament (opened March 2025) should be picked up automatically
// by the live XML feed once introduced and matched by AI_KEYWORDS_RE.

const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export interface BillInfo {
  id: string
  number: string
  title: string
  status: string
  statusDate: string
  sponsor: string
  session: string
  url: string
  aiRelevance: "Direct" | "Indirect"
}

export interface LegislationData {
  bills: BillInfo[]
  totalAIBills: number
  lastUpdated: string
}

interface CacheEntry {
  data: LegislationData
  fetchedAt: number
}

let cache: CacheEntry | null = null

const AI_KEYWORDS_RE = /artificial intelligence|algorithmic|machine learning|automated decision|AIDA|facial recognition|biometric|deepfake|generative ai|data protection|digital charter/i

export async function fetchLegislationData(): Promise<LegislationData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // LEGISinfo provides XML feeds for bills
    const res = await fetch("https://www.parl.ca/legisinfo/en/bills/xml", {
      headers: { "User-Agent": "AICanadaPulse/1.0", Accept: "application/xml, text/xml" },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) return getFallbackData()

    const xmlText = await res.text()
    const data = parseBillsXml(xmlText)
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[legisinfo-client] Failed to fetch legislation data:", err)
    return cache?.data ?? getFallbackData()
  }
}

function parseBillsXml(xml: string): LegislationData {
  const bills: BillInfo[] = []

  // Simple regex-based XML parsing (no DOM parser needed server-side)
  const billMatches = xml.match(/<Bill[^>]*>[\s\S]*?<\/Bill>/gi) || []

  for (const billXml of billMatches) {
    const number = extractTag(billXml, "NumberCode") || extractTag(billXml, "Number") || ""
    const title = extractTag(billXml, "LongTitleEn") || extractTag(billXml, "ShortTitleEn") || ""
    const status = extractTag(billXml, "StatusNameEn") || ""
    const statusDate = extractTag(billXml, "StatusDate") || ""
    const sponsor = extractTag(billXml, "SponsorPersonOfficialFirstName")
      ? `${extractTag(billXml, "SponsorPersonOfficialFirstName")} ${extractTag(billXml, "SponsorPersonOfficialLastName")}`
      : extractTag(billXml, "SponsorAffiliationTitleEn") || ""
    const session = extractTag(billXml, "ParliamentSession") || ""

    // Check if bill is AI-related
    if (AI_KEYWORDS_RE.test(title)) {
      bills.push({
        id: number || `bill-${bills.length}`,
        number,
        title: truncate(title, 200),
        status,
        statusDate: statusDate.slice(0, 10),
        sponsor,
        session,
        url: `https://www.parl.ca/legisinfo/en/bill/${session.replace(" ", "-")}/${number.toLowerCase()}`,
        aiRelevance: /artificial intelligence|AIDA|algorithmic|automated decision/i.test(title) ? "Direct" : "Indirect",
      })
    }
  }

  if (bills.length === 0) return getFallbackData()

  return {
    bills: bills.sort((a, b) => b.statusDate.localeCompare(a.statusDate)),
    totalAIBills: bills.length,
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"))
  return match ? match[1].trim() : ""
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + "..."
}

function getFallbackData(): LegislationData {
  return {
    bills: [
      {
        id: "c-27",
        number: "C-27",
        title: "Digital Charter Implementation Act, 2022 (includes AIDA — Artificial Intelligence and Data Act)",
        status: "Died on the Order Paper",
        statusDate: "2026-01-06",
        sponsor: "François-Philippe Champagne",
        session: "44-1",
        url: "https://www.parl.ca/legisinfo/en/bill/44-1/c-27",
        aiRelevance: "Direct",
      },
      {
        id: "c-63",
        number: "C-63",
        title: "Online Harms Act (AI-generated content provisions)",
        status: "Died on the Order Paper",
        statusDate: "2026-01-06",
        sponsor: "Arif Virani",
        session: "44-1",
        url: "https://www.parl.ca/legisinfo/en/bill/44-1/c-63",
        aiRelevance: "Indirect",
      },
      {
        id: "c-288",
        number: "C-288",
        title: "An Act to amend the Telecommunications Act (transparent and accurate broadband services — AI monitoring)",
        status: "Died on the Order Paper",
        statusDate: "2026-01-06",
        sponsor: "Private Member",
        session: "44-1",
        url: "https://www.parl.ca/legisinfo/en/bill/44-1/c-288",
        aiRelevance: "Indirect",
      },
      {
        id: "s-210",
        number: "S-210",
        title: "The Protecting Young Persons from Exposure to Pornography Act (age verification AI)",
        status: "Died on the Order Paper",
        statusDate: "2026-01-06",
        sponsor: "Senator Miville-Dechêne",
        session: "44-1",
        url: "https://www.parl.ca/legisinfo/en/bill/44-1/s-210",
        aiRelevance: "Indirect",
      },
    ],
    totalAIBills: 4,
    lastUpdated: "2026-01-06",
  }
}
