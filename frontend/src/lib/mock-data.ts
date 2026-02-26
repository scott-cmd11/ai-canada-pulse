export type Category = "Research" | "Policy & Regulation" | "Industry & Startups" | "Talent & Education" | "Global AI Race"
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
  sourceUrl?: string
  sourceName?: string
}

export interface PulseData {
  mood: "green" | "amber" | "red"
  moodLabel: string
  description: string
  updatedAt: string
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
    id: "research",
    icon: "🔬",
    label: "Research",
    status: "World-leading",
    trend: "up",
    description: "Canadian AI labs produced record publications this quarter, led by Mila and Vector Institute",
    sentiment: "positive",
  },
  {
    id: "policy",
    icon: "⚖️",
    label: "AI Policy",
    status: "Active",
    trend: "flat",
    description: "The federal government is advancing its AI and Data Act through committee review",
    sentiment: "neutral",
  },
  {
    id: "startups",
    icon: "🚀",
    label: "Startups & Funding",
    status: "Growing fast",
    trend: "up",
    description: "Canadian AI startups raised $2.1B in Q4, up 38% year-over-year",
    sentiment: "positive",
  },
  {
    id: "global",
    icon: "🌐",
    label: "Global Standing",
    status: "Competitive",
    trend: "flat",
    description: "Canada ranks 4th globally in AI research output and 3rd in AI talent density",
    sentiment: "neutral",
  },
]

// ─── Pulse Score ──────────────────────────────────────────────────────────────

export const pulseScore = {
  mood: "green" as "green" | "amber" | "red",
  moodLabel: "Thriving",
  description: "Canada's AI ecosystem is firing on all cylinders — Mila and Vector Institute are publishing at record pace, Cohere just closed a major funding round, and Ottawa is moving forward with its AI safety framework. The talent pipeline remains strong.",
  updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
}

// ─── Stories ─────────────────────────────────────────────────────────────────

const now = Date.now()

export const stories: Story[] = [
  {
    id: "s1",
    headline: "Cohere Raises $500M to Scale Enterprise AI Platform",
    summary:
      "Toronto-based Cohere has closed a $500M Series D round, valuing the company at $5.5B. The funding will accelerate its enterprise-focused large language model platform and expand its Montreal research office.",
    category: "Industry & Startups",
    region: "Ontario",
    publishedAt: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: true,
  },
  {
    id: "s2",
    headline: "Mila Publishes Breakthrough in Energy-Efficient AI Training",
    summary:
      "Researchers at Mila have developed a new training method that reduces compute costs by 40% for large language models. The paper, led by Yoshua Bengio's team, has been accepted at a top conference.",
    category: "Research",
    region: "Quebec",
    publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: true,
  },
  {
    id: "s3",
    headline: "Ottawa Announces AI Safety Framework for High-Risk Systems",
    summary:
      "The federal government has released its proposed AI safety framework, requiring impact assessments for high-risk AI systems in healthcare, finance, and criminal justice. Industry consultation opens next month.",
    category: "Policy & Regulation",
    region: "Federal",
    publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    isBriefingTop: true,
  },
  {
    id: "s4",
    headline: "Vector Institute Partners with Ontario Hospitals on AI Diagnostics",
    summary:
      "Vector Institute has launched a clinical AI partnership with five Ontario hospitals, deploying machine learning models for early detection of sepsis and cardiac events in emergency departments.",
    category: "Research",
    region: "Ontario",
    publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s5",
    headline: "Canadian AI Talent Increasingly Recruited by US Giants",
    summary:
      "A new report shows 30% of Canadian AI PhD graduates received offers from US tech firms last year, raising concerns about brain drain despite competitive salaries at domestic labs.",
    category: "Talent & Education",
    region: "Federal",
    publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    sentiment: "concerning",
    isBriefingTop: true,
  },
  {
    id: "s6",
    headline: "Ontario Invests $200M in AI Skills Training Programs",
    summary:
      "The Ontario government announced a $200M investment in AI upskilling programs targeting displaced workers and new graduates, with partnerships across colleges and universities province-wide.",
    category: "Talent & Education",
    region: "Ontario",
    publishedAt: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s7",
    headline: "CIFAR Renews Pan-Canadian AI Strategy with $443M in New Funding",
    summary:
      "CIFAR has secured renewed federal funding for the next phase of Canada's national AI strategy, supporting the three national AI institutes and expanding compute infrastructure.",
    category: "Policy & Regulation",
    region: "Federal",
    publishedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s8",
    headline: "Montreal Ranked Among Top-3 Global AI Research Hubs",
    summary:
      "A new global index ranks Montreal third worldwide for AI research output per capita, behind only San Francisco and London, citing Mila's influence and the city's growing startup ecosystem.",
    category: "Global AI Race",
    region: "Quebec",
    publishedAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s9",
    headline: "Tenstorrent Expands AI Chip Design Operations in Toronto",
    summary:
      "Jim Keller-led Tenstorrent is doubling its Toronto engineering team to 400 people as it scales production of its RISC-V-based AI accelerator chips, competing directly with Nvidia.",
    category: "Industry & Startups",
    region: "Ontario",
    publishedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s10",
    headline: "Alberta Launches AI-in-Energy Pilot Across Oil Sands Operations",
    summary:
      "Alberta's government is funding pilot programs to deploy AI for predictive maintenance and emissions monitoring across oil sands operations, aiming to cut methane leaks by 25%.",
    category: "Industry & Startups",
    region: "Alberta",
    publishedAt: new Date(now - 11 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    isBriefingTop: false,
  },
  {
    id: "s11",
    headline: "Canada and US Sign AI Safety Cooperation Agreement",
    summary:
      "Canada and the United States have signed a bilateral agreement on AI safety standards, committing to shared testing protocols for frontier models and coordinated incident reporting.",
    category: "Global AI Race",
    region: "Federal",
    publishedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
  {
    id: "s12",
    headline: "UBC and Waterloo AI Programs See Record Enrolment",
    summary:
      "Applications to AI and machine learning graduate programs at UBC and the University of Waterloo have surged 45% year-over-year, with international students making up over 60% of applicants.",
    category: "Talent & Education",
    region: "Federal",
    publishedAt: new Date(now - 13 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    isBriefingTop: false,
  },
]
