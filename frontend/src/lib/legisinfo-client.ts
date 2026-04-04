// LEGISinfo bill tracking client
// Fetches AI-related bills from Parliament of Canada
// Source: LEGISinfo JSON API — https://www.parl.ca/legisinfo/en/bills/json
// Docs: https://www.parl.ca/legisinfo/
//
// Current parliament: 45th Parliament, 1st Session (45-1), opened May 26, 2025
//
// Key previous bills (44th Parliament, died on prorogation 2026-01-06):
//   C-27  — Digital Charter Implementation Act, 2022 (includes AIDA)
//   C-63  — Online Harms Act (AI-generated content)

const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours
const CURRENT_SESSION = "45-1"

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

// Broader keyword set to catch more AI-adjacent bills
const AI_KEYWORDS_RE =
  /artificial intelligence|algorithmic|machine learning|automated decision|AIDA|facial recognition|biometric|deepfake|generative|data protection|digital charter|online harms|surveillance|privacy|cybersecurity|digital safety|platform|autonomous|robotics|data governance/i

const DIRECT_RE = /artificial intelligence|AIDA|algorithmic|automated decision|machine learning|generative|deepfake/i

// Shape of a single bill object returned by the LEGISinfo JSON API
interface LegisBill {
  BillNumberFormatted?: string
  LongTitleEn?: string
  ShortTitleEn?: string
  CurrentStatusEn?: string
  LatestActivityDateTime?: string
  SponsorEn?: string
  ParlSessionCode?: string
  [key: string]: unknown
}

export async function fetchLegislationData(): Promise<LegislationData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    const url = `https://www.parl.ca/legisinfo/en/bills/json?parlsession=${CURRENT_SESSION}`
    const res = await fetch(url, {
      headers: { "User-Agent": "AICanadaPulse/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.warn(`[legisinfo-client] HTTP ${res.status} from LEGISinfo JSON API`)
      return cache?.data ?? getFallbackData()
    }

    const json: LegisBill[] = await res.json()
    const data = parseBillsJson(json)
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[legisinfo-client] Failed to fetch legislation data:", err)
    return cache?.data ?? getFallbackData()
  }
}

function parseBillsJson(bills: LegisBill[]): LegislationData {
  const matched: BillInfo[] = []

  for (const bill of bills) {
    const number = bill.BillNumberFormatted ?? ""
    const title = bill.LongTitleEn ?? bill.ShortTitleEn ?? ""
    const status = bill.CurrentStatusEn ?? ""
    const statusDate = (bill.LatestActivityDateTime ?? "").slice(0, 10)
    const sponsor = bill.SponsorEn ?? ""
    const session = bill.ParlSessionCode ?? CURRENT_SESSION

    if (!number || !title) continue

    if (AI_KEYWORDS_RE.test(title)) {
      matched.push({
        id: number.toLowerCase(),
        number,
        title: truncate(title, 200),
        status,
        statusDate,
        sponsor,
        session,
        url: `https://www.parl.ca/legisinfo/en/bill/${session}/${number.toLowerCase()}`,
        aiRelevance: DIRECT_RE.test(title) ? "Direct" : "Indirect",
      })
    }
  }

  if (matched.length === 0) {
    console.warn("[legisinfo-client] No AI-related bills found in JSON response — using fallback")
    return getFallbackData()
  }

  return {
    bills: matched.sort((a, b) => b.statusDate.localeCompare(a.statusDate)),
    totalAIBills: matched.length,
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + "..."
}

function getFallbackData(): LegislationData {
  // Placeholder fallback — 45th Parliament bills as of April 2026
  // These are shown only when the live API is unreachable
  return {
    bills: [
      {
        id: "c-27-45",
        number: "C-27",
        title: "Digital Charter Implementation Act (45th Parliament reintroduction pending)",
        status: "Not yet introduced",
        statusDate: "2025-05-26",
        sponsor: "Government",
        session: "45-1",
        url: "https://www.parl.ca/legisinfo/en/bills?parlsession=45-1",
        aiRelevance: "Direct",
      },
      {
        id: "c-63-45",
        number: "C-63",
        title: "Online Harms Act (45th Parliament reintroduction pending)",
        status: "Not yet introduced",
        statusDate: "2025-05-26",
        sponsor: "Government",
        session: "45-1",
        url: "https://www.parl.ca/legisinfo/en/bills?parlsession=45-1",
        aiRelevance: "Indirect",
      },
    ],
    totalAIBills: 0, // 0 signals live data unavailable
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
}
