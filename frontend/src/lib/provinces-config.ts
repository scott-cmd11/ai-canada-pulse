// ─── Province Configuration ──────────────────────────────────────────────────
// Foundation config for all provincial pages, the Canada map component,
// and API filtering. Each entry describes one province/territory region.

export interface InstitutionConfig {
  name: string
  type: "lab" | "university" | "company"
  url?: string
}

export interface ProvinceSections {
  stories: boolean
  trends: boolean
  stocks: boolean
  research: boolean
  parliament: boolean
  jobs: boolean
}

export interface ProvinceConfig {
  slug: string
  name: string
  abbreviation: string
  capital: string
  /** Population in millions */
  population: number
  /** 1-2 sentence editorial blurb */
  description: string
  /** Name of the primary AI hub or corridor */
  aiHub: string
  /** Google Trends geo code (e.g. "CA-ON") */
  googleTrendsGeo: string
  institutions: InstitutionConfig[]
  sections: ProvinceSections
  neighborSlugs: string[]
  /** Only present for the Northern Territories aggregate entry */
  subRegions?: string[]
}

// ─── Province Data ───────────────────────────────────────────────────────────

export const PROVINCES: ProvinceConfig[] = [
  {
    slug: "ontario",
    name: "Ontario",
    abbreviation: "ON",
    capital: "Toronto",
    population: 15.8,
    description:
      "Ontario anchors Canada's AI economy through the Toronto–Waterloo Corridor, home to the highest concentration of AI researchers and startups in the country. The province hosts world-leading institutions that have shaped the global deep-learning era.",
    aiHub: "Toronto–Waterloo Corridor",
    googleTrendsGeo: "CA-ON",
    institutions: [
      { name: "Vector Institute", type: "lab" },
      { name: "CIFAR", type: "lab" },
      { name: "University of Toronto", type: "university" },
      { name: "University of Waterloo", type: "university" },
      { name: "Cohere", type: "company" },
      { name: "Shopify", type: "company" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
    },
    neighborSlugs: ["quebec", "manitoba"],
  },
  {
    slug: "quebec",
    name: "Quebec",
    abbreviation: "QC",
    capital: "Quebec City",
    population: 8.9,
    description:
      "Quebec's Montreal AI Corridor is one of the world's premier AI research ecosystems, driven by Mila and its affiliated universities. The province has attracted major international investment and produced foundational advances in deep learning.",
    aiHub: "Montreal AI Corridor",
    googleTrendsGeo: "CA-QC",
    institutions: [
      { name: "Mila", type: "lab" },
      { name: "McGill University", type: "university" },
      { name: "Université de Montréal", type: "university" },
      { name: "Element AI (legacy)", type: "company" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
    },
    neighborSlugs: ["ontario", "new-brunswick", "northern-territories"],
  },
  {
    slug: "british-columbia",
    name: "British Columbia",
    abbreviation: "BC",
    capital: "Victoria",
    population: 5.4,
    description:
      "British Columbia's Vancouver Tech Hub bridges Canadian AI talent with Pacific Rim markets, hosting a thriving ecosystem of AI startups and research institutions. The province is a leader in quantum computing through D-Wave.",
    aiHub: "Vancouver Tech Hub",
    googleTrendsGeo: "CA-BC",
    institutions: [
      { name: "University of British Columbia", type: "university" },
      { name: "Simon Fraser University", type: "university" },
      { name: "D-Wave", type: "company" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
    },
    neighborSlugs: ["alberta", "northern-territories"],
  },
  {
    slug: "alberta",
    name: "Alberta",
    abbreviation: "AB",
    capital: "Edmonton",
    population: 4.6,
    description:
      "Alberta's Edmonton AI Corridor is anchored by Amii and the University of Alberta, birthplace of foundational reinforcement learning research. The province is rapidly expanding its AI sector alongside its energy transition agenda.",
    aiHub: "Edmonton AI Corridor",
    googleTrendsGeo: "CA-AB",
    institutions: [
      { name: "Amii", type: "lab" },
      { name: "University of Alberta", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
    },
    neighborSlugs: ["british-columbia", "saskatchewan", "northern-territories"],
  },
  {
    slug: "saskatchewan",
    name: "Saskatchewan",
    abbreviation: "SK",
    capital: "Regina",
    population: 1.2,
    description:
      "Saskatchewan is applying AI to agriculture, precision farming, and natural resource management, leveraging its vast prairies as a living lab for intelligent systems.",
    aiHub: "Saskatoon AgriTech Cluster",
    googleTrendsGeo: "CA-SK",
    institutions: [
      { name: "University of Saskatchewan", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: ["alberta", "manitoba", "northern-territories"],
  },
  {
    slug: "manitoba",
    name: "Manitoba",
    abbreviation: "MB",
    capital: "Winnipeg",
    population: 1.4,
    description:
      "Manitoba is building an AI ecosystem centred on health informatics, data analytics, and its growing tech sector in Winnipeg.",
    aiHub: "Winnipeg Tech District",
    googleTrendsGeo: "CA-MB",
    institutions: [
      { name: "University of Manitoba", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: ["saskatchewan", "ontario", "northern-territories"],
  },
  {
    slug: "nova-scotia",
    name: "Nova Scotia",
    abbreviation: "NS",
    capital: "Halifax",
    population: 1.0,
    description:
      "Nova Scotia is emerging as an Atlantic Canadian AI hub, with Dalhousie University and a growing ocean-technology sector driving applied AI research.",
    aiHub: "Halifax Innovation District",
    googleTrendsGeo: "CA-NS",
    institutions: [
      { name: "Dalhousie University", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: ["new-brunswick"],
  },
  {
    slug: "new-brunswick",
    name: "New Brunswick",
    abbreviation: "NB",
    capital: "Fredericton",
    population: 0.82,
    description:
      "New Brunswick is leveraging bilingual talent and its cybersecurity cluster to carve out a niche in applied AI and data services.",
    aiHub: "Fredericton Cybersecurity Cluster",
    googleTrendsGeo: "CA-NB",
    institutions: [
      { name: "University of New Brunswick", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: ["quebec", "nova-scotia"],
  },
  {
    slug: "newfoundland-labrador",
    name: "Newfoundland & Labrador",
    abbreviation: "NL",
    capital: "St. John's",
    population: 0.53,
    description:
      "Newfoundland & Labrador is applying AI to ocean science, fisheries management, and offshore energy, with Memorial University driving research at the edge of the North Atlantic.",
    aiHub: "St. John's Ocean Tech Hub",
    googleTrendsGeo: "CA-NL",
    institutions: [
      { name: "Memorial University of Newfoundland", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: [],
  },
  {
    slug: "prince-edward-island",
    name: "Prince Edward Island",
    abbreviation: "PE",
    capital: "Charlottetown",
    population: 0.17,
    description:
      "Prince Edward Island is Canada's smallest province, pioneering AI applications in agri-food, tourism, and public-sector services through UPEI and growing tech clusters.",
    aiHub: "Charlottetown Tech Community",
    googleTrendsGeo: "CA-PE",
    institutions: [
      { name: "University of Prince Edward Island", type: "university" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: ["nova-scotia", "new-brunswick"],
  },
  {
    slug: "northern-territories",
    name: "Northern Territories",
    abbreviation: "NT",
    capital: "Whitehorse",
    population: 0.13,
    description:
      "Canada's three northern territories — Yukon, Northwest Territories, and Nunavut — are exploring AI for remote healthcare, environmental monitoring, and Indigenous language preservation across vast and challenging geographies.",
    aiHub: "Northern Digital Initiative",
    googleTrendsGeo: "CA",
    institutions: [],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
    },
    neighborSlugs: [
      "british-columbia",
      "alberta",
      "saskatchewan",
      "manitoba",
      "quebec",
    ],
    subRegions: ["yukon", "northwest-territories", "nunavut"],
  },
]

// ─── Helper functions ────────────────────────────────────────────────────────

export function getProvinceBySlug(slug: string): ProvinceConfig | undefined {
  return PROVINCES.find((p) => p.slug === slug)
}

export function getAllProvinceSlugs(): string[] {
  return PROVINCES.map((p) => p.slug)
}
