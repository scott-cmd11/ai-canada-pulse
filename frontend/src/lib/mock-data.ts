export type Category = "Jobs & Money" | "Homes & Rent" | "Your Government" | "Canada & the US" | "Climate"
export type Sentiment = "positive" | "neutral" | "concerning"
export type Trend = "up" | "flat" | "down"

export interface Story {
  id: string
  headline: string
  summary: string
  category: Category
  region: string
  publishedAt: string
  sentiment: Sentiment
  isBriefingTop: boolean
}

export interface Metric {
  id: string
  icon: string
  label: string
  status: string
  trend: Trend
  description: string
  sentiment: Sentiment
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export const metrics: Metric[] = [
  {
    id: "economy",
    icon: "💼",
    label: "Jobs",
    status: "Steady",
    trend: "up",
    description: "Hiring is strong and wages are growing in most parts of Canada",
    sentiment: "positive",
  },
  {
    id: "housing",
    icon: "🏠",
    label: "Homes",
    status: "Under Pressure",
    trend: "down",
    description: "Rent and home prices are still high in most cities",
    sentiment: "concerning",
  },
  {
    id: "politics",
    icon: "🏛️",
    label: "Your Government",
    status: "In Session",
    trend: "flat",
    description: "Parliament is back and a lot is on the table right now",
    sentiment: "neutral",
  },
  {
    id: "trade",
    icon: "🌐",
    label: "Canada & the US",
    status: "At Risk",
    trend: "down",
    description: "New US tariff threats could affect Canadian jobs and prices",
    sentiment: "concerning",
  },
]

// ─── Pulse Score ──────────────────────────────────────────────────────────────

export const pulseScore = {
  mood: "amber" as "green" | "amber" | "red",
  moodLabel: "Holding Steady",
  description: "Canada is navigating some real pressures — especially on trade and housing — while jobs remain mostly stable.",
  updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
}

// ─── Stories ─────────────────────────────────────────────────────────────────

const now = Date.now()

export const stories: Story[] = [
  {
    id: "s1",
    headline: "US Threatens New Tariffs on Canadian Steel and Aluminum",
    summary:
      "The White House is signalling a fresh round of tariffs targeting Canadian metals. Ottawa says it will respond with counter-measures if the tariffs go ahead.",
    category: "Canada & the US",
    region: "Federal",
    publishedAt: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: true,
  },
  {
    id: "s2",
    headline: "Bank of Canada Rate Decision Coming Next Week",
    summary:
      "Experts are split on whether the Bank of Canada will hold interest rates or cut them. A cut could ease mortgage costs for millions of Canadians.",
    category: "Jobs & Money",
    region: "Federal",
    publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    isBriefingTop: true,
  },
  {
    id: "s3",
    headline: "Toronto Rent Prices Hold Steady for Second Month in a Row",
    summary:
      "After years of sharp increases, average rent in Toronto has stopped climbing — a tentative sign of relief for renters in Canada's most expensive city.",
    category: "Homes & Rent",
    region: "Ontario",
    publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s4",
    headline: "Parliament Resumes with Confidence Vote on the Horizon",
    summary:
      "MPs return to Ottawa this week with opposition parties signalling they may force a non-confidence vote before spring, potentially triggering an election.",
    category: "Your Government",
    region: "Federal",
    publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    isBriefingTop: true,
  },
  {
    id: "s5",
    headline: "Canada Added 35,000 Jobs Last Month",
    summary:
      "The latest jobs report shows strong hiring in construction and healthcare. The unemployment rate dipped slightly to 6.1%.",
    category: "Jobs & Money",
    region: "Federal",
    publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: true,
  },
  {
    id: "s6",
    headline: "BC Wildfire Season Expected to Start Earlier This Year",
    summary:
      "Provincial officials are warning of a potentially severe wildfire season due to low snowpack and dry conditions across the BC Interior.",
    category: "Climate",
    region: "BC",
    publishedAt: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: false,
  },
  {
    id: "s7",
    headline: "Alberta Pushes Back on Federal Carbon Pricing Rules",
    summary:
      "Alberta's government is escalating its dispute with Ottawa over carbon pricing, threatening to withhold co-operation on energy transition funding.",
    category: "Your Government",
    region: "Alberta",
    publishedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: false,
  },
  {
    id: "s8",
    headline: "New Homes Plan Targets 1.2 Million Units by 2030",
    summary:
      "The federal government announced a major housing plan pledging to unlock funding for 1.2 million new homes over the next six years, focusing on rental and affordable units.",
    category: "Homes & Rent",
    region: "Federal",
    publishedAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s9",
    headline: "Canadian Auto Sector Warns of US Tariff Impact on Jobs",
    summary:
      "Auto manufacturers in Ontario say new US tariffs could put thousands of jobs at risk as cross-border supply chains come under pressure.",
    category: "Canada & the US",
    region: "Ontario",
    publishedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: false,
  },
  {
    id: "s10",
    headline: "Quebec Launches Green Transit Expansion in Montreal",
    summary:
      "Montreal will receive $4 billion to expand its metro and electric bus network, cutting commute times for hundreds of thousands of residents.",
    category: "Climate",
    region: "Quebec",
    publishedAt: new Date(now - 11 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s11",
    headline: "Grocery Prices Still High Despite Retailer Pledges",
    summary:
      "Food costs remain elevated across Canada even as major grocery chains promised to stabilize prices. Advocacy groups say more accountability is needed.",
    category: "Jobs & Money",
    region: "Federal",
    publishedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: false,
  },
  {
    id: "s12",
    headline: "Halifax Housing Market Shows Signs of Cooling",
    summary:
      "After a post-pandemic surge, home prices in Halifax have begun to ease as demand softens and more listings come to market.",
    category: "Homes & Rent",
    region: "Nova Scotia",
    publishedAt: new Date(now - 13 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
]
