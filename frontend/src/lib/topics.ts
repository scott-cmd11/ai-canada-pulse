// Topic registry — single source of truth for the 20 canonical Canadian AI topics.
// Used by: topic-tagger.ts (regex pre-filter + LLM prompt), /api/v1/topics,
// /topics index + topic pages, per-topic RSS feeds, newsletter composer.

export const TOPIC_CATEGORIES = [
  "Policy & Governance",
  "Infrastructure",
  "Applications",
  "Research",
  "Ecosystem",
] as const

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number]

export interface Topic {
  slug: string
  label: string
  category: TopicCategory
  shortDescription: string
  heroLede: string
  // Keyword seeds feed the regex pre-filter in topic-tagger.ts.
  // Match is case-insensitive, word-boundary. Keep tight — noisy seeds erode precision.
  keywordSeeds: string[]
}

export const TOPICS: Topic[] = [
  // ─── Policy & Governance ─────────────────────────────────────────────
  {
    slug: "aida",
    label: "AIDA (AI & Data Act)",
    category: "Policy & Governance",
    shortDescription: "Bill C-27's proposed federal AI regulation.",
    heroLede:
      "The Artificial Intelligence and Data Act is Canada's proposed federal framework for regulating high-impact AI systems. It defines obligations for developers, deployers, and operators, and sits inside the broader Bill C-27 privacy reform package.",
    keywordSeeds: ["AIDA", "Bill C-27", "C-27", "AI and Data Act", "Artificial Intelligence and Data Act"],
  },
  {
    slug: "pan-canadian-ai-strategy",
    label: "Pan-Canadian AI Strategy",
    category: "Policy & Governance",
    shortDescription: "The national funding and institute strategy run by CIFAR.",
    heroLede:
      "Launched in 2017 and renewed in 2022, the Pan-Canadian AI Strategy is the federal program funding Canada's three national AI institutes — Mila, Vector, and Amii — along with the broader research ecosystem, via CIFAR.",
    keywordSeeds: ["Pan-Canadian AI Strategy", "CIFAR", "national AI strategy"],
  },
  {
    slug: "provincial-ai-policy",
    label: "Provincial AI Policy",
    category: "Policy & Governance",
    shortDescription: "AI legislation and guidance at the provincial level.",
    heroLede:
      "While Ottawa moves on AIDA, provinces are advancing their own AI rules — from Quebec's Law 25 and Ontario's public-sector directives to BC's privacy guidance. Provincial policy often lands first and shapes day-to-day practice.",
    keywordSeeds: [
      "provincial AI",
      "Ontario AI",
      "Quebec AI",
      "BC AI",
      "Alberta AI",
      "Law 25",
      "Ontario AI directive",
    ],
  },
  {
    slug: "privacy-pipeda",
    label: "Privacy & PIPEDA",
    category: "Policy & Governance",
    shortDescription: "Federal privacy law and its interaction with AI.",
    heroLede:
      "PIPEDA governs how private-sector organizations handle personal information in Canada. AI systems trained on or deployed against personal data sit squarely inside its scope — and Bill C-27's CPPA would replace it.",
    keywordSeeds: [
      "PIPEDA",
      "privacy commissioner",
      "CPPA",
      "Consumer Privacy Protection Act",
      "OPC",
      "Office of the Privacy Commissioner",
    ],
  },
  {
    slug: "copyright-ai-training",
    label: "Copyright & AI Training",
    category: "Policy & Governance",
    shortDescription: "Canadian copyright law meets generative AI.",
    heroLede:
      "Whether training generative models on copyrighted works is permissible under Canada's Copyright Act is an open question. Ongoing consultations and court filings will shape what Canadian creators, publishers, and model builders can do.",
    keywordSeeds: ["copyright", "Copyright Act", "training data", "text and data mining", "TDM"],
  },

  // ─── Infrastructure ──────────────────────────────────────────────────
  {
    slug: "compute-capacity",
    label: "Compute Capacity",
    category: "Infrastructure",
    shortDescription: "Data centres, GPUs, and sovereign compute in Canada.",
    heroLede:
      "From hyperscaler cloud regions in Toronto and Montreal to HPC clusters at the Digital Research Alliance, Canadian AI compute capacity is expanding fast. Cost, location, and sovereignty all shape who gets to train what.",
    keywordSeeds: [
      "data centre",
      "data center",
      "GPU",
      "HPC",
      "compute capacity",
      "Digital Research Alliance",
      "sovereign compute",
      "hyperscaler",
    ],
  },
  {
    slug: "foundation-models-sovereign-ai",
    label: "Foundation Models & Sovereign AI",
    category: "Infrastructure",
    shortDescription: "Canadian-built foundation models and sovereignty debates.",
    heroLede:
      "Should Canada build its own frontier models, or buy access from US and international providers? The sovereign AI debate spans Cohere's commercial models, academic research efforts, and federal industrial strategy.",
    keywordSeeds: [
      "foundation model",
      "sovereign AI",
      "Cohere",
      "AI21",
      "frontier model",
      "Canadian LLM",
    ],
  },
  {
    slug: "ai-talent-immigration",
    label: "AI Talent & Immigration",
    category: "Infrastructure",
    shortDescription: "Global AI talent streams, retention, and brain drain.",
    heroLede:
      "Canada's AI advantage has been its researchers. Immigration streams like the Global Talent Stream and retention of homegrown PhDs shape whether that advantage holds — and where talent ends up deploying it.",
    keywordSeeds: [
      "Global Talent Stream",
      "AI talent",
      "brain drain",
      "immigration",
      "work permit",
      "Express Entry",
    ],
  },
  {
    slug: "ai-investment-funding",
    label: "AI Investment & Funding",
    category: "Infrastructure",
    shortDescription: "Venture capital, federal programs, and public funding flowing into Canadian AI.",
    heroLede:
      "Canadian AI runs on a mix of venture capital, federal programs like SIF and SR&ED, and provincial innovation funds. Where the money flows — and on what terms — shapes which companies and labs scale.",
    keywordSeeds: [
      "AI funding",
      "AI investment",
      "Series A",
      "Series B",
      "venture capital",
      "SIF",
      "Strategic Innovation Fund",
      "SR&ED",
      "raise",
    ],
  },

  // ─── Applications ────────────────────────────────────────────────────
  {
    slug: "ai-healthcare",
    label: "AI in Healthcare",
    category: "Applications",
    shortDescription: "Clinical AI, diagnostics, and health system deployments.",
    heroLede:
      "From diagnostic imaging to administrative automation, AI is moving into Canadian hospitals and clinics. Adoption is uneven — shaped by provincial health systems, Health Canada approval pathways, and clinician trust.",
    keywordSeeds: [
      "AI healthcare",
      "AI health",
      "medical AI",
      "clinical AI",
      "diagnostic AI",
      "Health Canada",
      "hospital AI",
    ],
  },
  {
    slug: "ai-finance",
    label: "AI in Finance",
    category: "Applications",
    shortDescription: "AI in banking, insurance, and capital markets.",
    heroLede:
      "Canada's Big Five banks and major insurers are among the largest enterprise deployers of AI in the country. Regulatory scrutiny from OSFI and the consumer agency shapes what gets built and how.",
    keywordSeeds: [
      "AI banking",
      "AI finance",
      "RBC",
      "TD Bank",
      "Scotiabank",
      "BMO",
      "CIBC",
      "OSFI",
      "fintech AI",
    ],
  },
  {
    slug: "ai-public-services",
    label: "AI in Public Services",
    category: "Applications",
    shortDescription: "AI inside government — federal, provincial, and municipal.",
    heroLede:
      "Governments use AI for everything from immigration triage to tax compliance to service-delivery chatbots. The Treasury Board's Directive on Automated Decision-Making sets the federal rulebook.",
    keywordSeeds: [
      "government AI",
      "public sector AI",
      "Treasury Board",
      "Automated Decision-Making",
      "ADM directive",
      "IRCC",
      "CRA",
      "Service Canada",
    ],
  },
  {
    slug: "ai-agriculture",
    label: "AI in Agriculture",
    category: "Applications",
    shortDescription: "Precision agriculture and AI on Canadian farms.",
    heroLede:
      "Canadian agriculture is an early adopter of machine vision, satellite analytics, and predictive models — from grain-yield forecasting to livestock monitoring. Prairie research clusters anchor much of the work.",
    keywordSeeds: [
      "agtech",
      "ag-tech",
      "agriculture AI",
      "precision agriculture",
      "smart farming",
      "AAFC",
      "agri-food",
    ],
  },
  {
    slug: "ai-energy-mining",
    label: "AI in Energy & Mining",
    category: "Applications",
    shortDescription: "AI in oil and gas, renewables, and critical minerals.",
    heroLede:
      "Canada's resource sector uses AI for everything from seismic interpretation to autonomous haul trucks to grid forecasting. Pace of adoption differs sharply between oil-sands operators, miners, and utilities.",
    keywordSeeds: [
      "energy AI",
      "mining AI",
      "oil and gas AI",
      "oilsands AI",
      "utility AI",
      "grid AI",
      "critical minerals",
    ],
  },

  // ─── Research ────────────────────────────────────────────────────────
  {
    slug: "mila-vector-amii",
    label: "Mila · Vector · Amii",
    category: "Research",
    shortDescription: "Canada's three national AI institutes.",
    heroLede:
      "Mila (Montreal), Vector (Toronto), and Amii (Edmonton) are Canada's federally designated AI research institutes. Together they anchor the academic AI ecosystem and produce a disproportionate share of global AI talent.",
    keywordSeeds: ["Mila", "Vector Institute", "Amii", "Yoshua Bengio", "Geoffrey Hinton", "Richard Sutton"],
  },
  {
    slug: "academic-research",
    label: "Academic Research",
    category: "Research",
    shortDescription: "Papers, labs, and benchmarks from Canadian universities.",
    heroLede:
      "Beyond the three institutes, Canadian AI research spans dozens of university labs publishing on arXiv and at top venues. Tracking paper output is a leading indicator of where the field is going.",
    keywordSeeds: [
      "arXiv",
      "NeurIPS",
      "ICML",
      "ICLR",
      "research paper",
      "preprint",
      "University of Toronto",
      "UBC",
      "McGill",
      "Université de Montréal",
      "Waterloo",
    ],
  },
  {
    slug: "ai-safety-alignment",
    label: "AI Safety & Alignment",
    category: "Research",
    shortDescription: "Technical alignment, evals, and AI risk research in Canada.",
    heroLede:
      "Canadian researchers — including Yoshua Bengio's Montreal AI safety work and the federally backed Canadian AI Safety Institute — are central to global alignment, evaluations, and catastrophic-risk research.",
    keywordSeeds: [
      "AI safety",
      "AI alignment",
      "AI risk",
      "existential risk",
      "catastrophic risk",
      "AI Safety Institute",
      "CAISI",
      "red team",
    ],
  },

  // ─── Ecosystem ───────────────────────────────────────────────────────
  {
    slug: "canadian-ai-startups",
    label: "Canadian AI Startups",
    category: "Ecosystem",
    shortDescription: "Founders, exits, and the Canadian AI startup stack.",
    heroLede:
      "From Cohere to Ada to Waabi, Canadian AI startups are building across model layers, vertical applications, and infrastructure. Founding patterns, raises, and exits map the ecosystem's health.",
    keywordSeeds: [
      "Canadian AI startup",
      "Canadian startup",
      "Cohere",
      "Ada",
      "Waabi",
      "Clio",
      "Shopify AI",
      "startup raise",
    ],
  },
  {
    slug: "ai-jobs-market",
    label: "AI Jobs Market",
    category: "Ecosystem",
    shortDescription: "Hiring, layoffs, and the state of AI employment in Canada.",
    heroLede:
      "AI job postings, salary bands, and layoff waves all signal where enterprise demand is heading. Canadian data from Job Bank, LinkedIn, and public filings paints a shifting picture.",
    keywordSeeds: [
      "AI jobs",
      "AI hiring",
      "AI layoff",
      "machine learning engineer",
      "AI salary",
      "Job Bank",
      "tech layoff",
    ],
  },
  {
    slug: "regional-ecosystems",
    label: "Regional Ecosystems",
    category: "Ecosystem",
    shortDescription: "Toronto, Montreal, Edmonton, Vancouver — and beyond.",
    heroLede:
      "Canada's AI story is a regional one. Toronto dominates commercial AI, Montreal anchors deep learning research, Edmonton leads reinforcement learning, and Vancouver is the emerging applied hub. Each region has its own character.",
    keywordSeeds: [
      "Toronto AI",
      "Montreal AI",
      "Edmonton AI",
      "Vancouver AI",
      "Ottawa AI",
      "Waterloo AI",
      "Kitchener-Waterloo",
      "tech hub",
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug)
}

export function getTopicsByCategory(category: TopicCategory): Topic[] {
  return TOPICS.filter((t) => t.category === category)
}

export function getAllTopicSlugs(): string[] {
  return TOPICS.map((t) => t.slug)
}
