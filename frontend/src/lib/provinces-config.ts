// ─── Province & Territory Configuration ──────────────────────────────────────
// Foundation config for all provincial/territorial pages, the Canada map
// component, and API filtering.
/**
 * Last audited: 2026-03-31
 * Population source: Statistics Canada, Table 17-10-0009-01
 *   "Population estimates, quarterly" — Q4 2025 (January 1, 2026)
 *   Released March 18, 2026. https://www150.statcan.gc.ca/n1/daily-quotidien/260318/dq260318b-eng.htm
 * Next review recommended: 2027-03-31 (12 months)
 */

export type ProvinceRegion = 'Atlantic' | 'Central' | 'Prairies' | 'Pacific' | 'North'

export interface InstitutionConfig {
  name: string
  type: "institute" | "university" | "company"
  url: string
}

export interface ProvinceSections {
  stories: boolean
  trends: boolean
  stocks: boolean
  research: boolean
  parliament: boolean
  jobs: boolean
  talent: boolean
  startups: boolean
  events: boolean
  regulation: boolean
}

export interface ProvinceConfig {
  slug: string
  name: string
  abbreviation: string
  capital: string
  /** Province/territory population in millions (not capital city) */
  population: number
  /** Source date for population figure, e.g. "Jan 1, 2026 (Stats Canada Q4 2025)" */
  populationAsOf: string
  /** Geographic region grouping */
  region: ProvinceRegion
  /** 1-2 sentence editorial blurb */
  description: string
  /** Google Trends geo code (e.g. "CA-ON") */
  googleTrendsGeo: string
  institutions: InstitutionConfig[]
  sections: ProvinceSections
  neighborSlugs: string[]
  lastVerified: string  // ISO date, e.g. "2026-03-31"
}

// ─── Province & Territory Data ───────────────────────────────────────────────

export const PROVINCES: ProvinceConfig[] = [
  // ── Central Canada ──────────────────────────────────────────────────────────
  {
    slug: "ontario",
    name: "Ontario",
    abbreviation: "ON",
    capital: "Toronto",
    population: 16.1,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Central",
    description:
      "Canada's most populous province. Home to Vector Institute and CIFAR — two of the three Pan-Canadian AI institutes.",
    googleTrendsGeo: "CA-ON",
    institutions: [
      { name: "Vector Institute", type: "institute", url: "https://vectorinstitute.ai" },
      { name: "CIFAR", type: "institute", url: "https://cifar.ca" },
      { name: "University of Toronto", type: "university", url: "https://web.cs.toronto.edu" },
      { name: "University of Waterloo", type: "university", url: "https://uwaterloo.ca/artificial-intelligence-group" },
      { name: "Cohere", type: "company", url: "https://cohere.com" },
      { name: "Shopify", type: "company", url: "https://shopify.engineering" },
    ],
    sections: {
      stories: true, trends: true, stocks: true, research: true,
      parliament: true, jobs: true, talent: true, startups: true, events: true, regulation: true,
    },
    neighborSlugs: ["quebec", "manitoba"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "quebec",
    name: "Quebec",
    abbreviation: "QC",
    capital: "Quebec City",
    population: 9.0,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Central",
    description:
      "Home to Mila — one of the world's leading academic deep-learning research institutes, founded by Turing Award winner Yoshua Bengio.",
    googleTrendsGeo: "CA-QC",
    institutions: [
      { name: "Mila", type: "institute", url: "https://mila.quebec" },
      { name: "McGill University", type: "university", url: "https://www.cs.mcgill.ca" },
      { name: "Université de Montréal", type: "university", url: "https://diro.umontreal.ca" },
    ],
    sections: {
      stories: true, trends: true, stocks: true, research: true,
      parliament: true, jobs: true, talent: true, startups: true, events: true, regulation: true,
    },
    neighborSlugs: ["ontario", "new-brunswick", "northwest-territories"],
    lastVerified: "2026-03-31",
  },
  // ── Prairie Provinces ────────────────────────────────────────────────────────
  {
    slug: "alberta",
    name: "Alberta",
    abbreviation: "AB",
    capital: "Edmonton",
    population: 5.0,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Prairies",
    description:
      "Home to Amii, the third Pan-Canadian AI institute, anchored at the University of Alberta — a global leader in reinforcement learning research.",
    googleTrendsGeo: "CA-AB",
    institutions: [
      { name: "Amii", type: "institute", url: "https://amii.ca" },
      { name: "University of Alberta", type: "university", url: "https://www.ualberta.ca/computing-science" },
    ],
    sections: {
      stories: true, trends: true, stocks: true, research: true,
      parliament: true, jobs: true, talent: true, startups: true, events: true, regulation: true,
    },
    neighborSlugs: ["british-columbia", "saskatchewan", "northwest-territories"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "saskatchewan",
    name: "Saskatchewan",
    abbreviation: "SK",
    capital: "Regina",
    population: 1.3,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Prairies",
    description:
      "The University of Saskatchewan leads AI research programmes focused on agriculture, precision farming, and natural resource management.",
    googleTrendsGeo: "CA-SK",
    institutions: [
      { name: "University of Saskatchewan", type: "university", url: "https://cs.usask.ca" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["alberta", "manitoba", "northwest-territories", "nunavut"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "manitoba",
    name: "Manitoba",
    abbreviation: "MB",
    capital: "Winnipeg",
    population: 1.5,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Prairies",
    description:
      "The University of Manitoba has growing AI and data science research programmes, with strengths in health informatics and Indigenous data sovereignty.",
    googleTrendsGeo: "CA-MB",
    institutions: [
      { name: "University of Manitoba", type: "university", url: "https://sci.umanitoba.ca/cs" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["saskatchewan", "ontario", "nunavut"],
    lastVerified: "2026-03-31",
  },
  // ── Pacific ──────────────────────────────────────────────────────────────────
  {
    slug: "british-columbia",
    name: "British Columbia",
    abbreviation: "BC",
    capital: "Victoria",
    population: 5.7,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Pacific",
    description:
      "Home to D-Wave Systems — a global leader in quantum computing — and two major research universities driving AI innovation in Vancouver.",
    googleTrendsGeo: "CA-BC",
    institutions: [
      { name: "University of British Columbia", type: "university", url: "https://www.cs.ubc.ca" },
      { name: "Simon Fraser University", type: "university", url: "https://www.sfu.ca/computing.html" },
      { name: "D-Wave", type: "company", url: "https://www.dwavesys.com" },
    ],
    sections: {
      stories: true, trends: true, stocks: true, research: true,
      parliament: true, jobs: true, talent: true, startups: true, events: true, regulation: true,
    },
    neighborSlugs: ["alberta", "yukon"],
    lastVerified: "2026-03-31",
  },
  // ── Atlantic Canada ──────────────────────────────────────────────────────────
  {
    slug: "nova-scotia",
    name: "Nova Scotia",
    abbreviation: "NS",
    capital: "Halifax",
    population: 1.1,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Atlantic",
    description:
      "Nova Scotia's AI ecosystem is anchored by Dalhousie University and its ocean-focused research centres — DeepSense and the Ocean Frontier Institute — alongside a growing startup community supported by Invest Nova Scotia and a provincial government AI team established in 2025.",
    googleTrendsGeo: "CA-NS",
    institutions: [
      { name: "Dalhousie University",     type: "university", url: "https://www.dal.ca/research-and-innovation/research-clusters/ai-and-digital-innovation.html" },
      { name: "Saint Mary's University",  type: "university", url: "https://www.smu.ca/academics/sobey/data-science.html" },
      { name: "Acadia University",        type: "university", url: "https://cs.acadiau.ca/" },
      { name: "NSCC",                     type: "university", url: "https://www.nscc.ca/programs-and-courses/programs/plandescr.aspx?prg=ITAI&pln=AITECHAD" },
      { name: "DeepSense",                type: "institute",  url: "https://deepsense.ca/" },
      { name: "Ocean Frontier Institute", type: "institute",  url: "https://oceanfrontierinstitute.com/" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: true,
      parliament: false, jobs: false, talent: false, startups: true, events: true, regulation: true,
    },
    neighborSlugs: ["new-brunswick", "prince-edward-island"],
    lastVerified: "2026-04-14",
  },
  {
    slug: "new-brunswick",
    name: "New Brunswick",
    abbreviation: "NB",
    capital: "Fredericton",
    population: 0.87,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Atlantic",
    description:
      "New Brunswick's AI ecosystem spans cybersecurity research at UNB's Canadian Institute for Cybersecurity, health AI at Université de Moncton's PRIME Lab, and a growing commercial sector anchored by Introhive — Atlantic Canada's largest-funded tech company.",
    googleTrendsGeo: "CA-NB",
    institutions: [
      { name: "University of New Brunswick", type: "university", url: "https://www.unb.ca/cic" },
      { name: "Université de Moncton",       type: "university", url: "https://www.umoncton.ca/bsi/en/node/12" },
      { name: "McKenna Institute",           type: "institute",  url: "https://blogs.unb.ca/mckenna/" },
      { name: "UNB RIDSAI",                  type: "institute",  url: "https://www.unb.ca/ridsai/" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: true,
      parliament: false, jobs: false, talent: false, startups: true, events: false, regulation: true,
    },
    neighborSlugs: ["quebec", "nova-scotia", "prince-edward-island"],
    lastVerified: "2026-04-14",
  },
  {
    slug: "newfoundland-labrador",
    name: "Newfoundland & Labrador",
    abbreviation: "NL",
    capital: "St. John's",
    population: 0.55,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Atlantic",
    description:
      "Memorial University conducts AI research applied to ocean science, offshore energy, and remote health delivery across coastal communities.",
    googleTrendsGeo: "CA-NL",
    institutions: [
      { name: "Memorial University of Newfoundland", type: "university", url: "https://www.mun.ca/computerscience" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["new-brunswick", "nova-scotia"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "prince-edward-island",
    name: "Prince Edward Island",
    abbreviation: "PE",
    capital: "Charlottetown",
    population: 0.18,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "Atlantic",
    description:
      "UPEI's School of Mathematical and Computational Sciences has emerging data science and AI programmes supporting the province's digital economy.",
    googleTrendsGeo: "CA-PE",
    institutions: [
      { name: "University of Prince Edward Island", type: "university", url: "https://www.upei.ca/programs/computer-science" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["nova-scotia", "new-brunswick"],
    lastVerified: "2026-03-31",
  },
  // ── Northern Territories ─────────────────────────────────────────────────────
  {
    slug: "yukon",
    name: "Yukon",
    abbreviation: "YT",
    capital: "Whitehorse",
    population: 0.048,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "North",
    description:
      "Yukon University — Canada's newest university — is building capacity in digital technology and AI to support remote communities and the resource sector.",
    googleTrendsGeo: "CA-YT",
    institutions: [
      { name: "Yukon University", type: "university", url: "https://www.yukonu.ca" },
    ],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["british-columbia", "northwest-territories"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "northwest-territories",
    name: "Northwest Territories",
    abbreviation: "NT",
    capital: "Yellowknife",
    population: 0.046,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "North",
    description:
      "The NWT is investing in broadband connectivity and digital infrastructure to bring AI-assisted services to 33 remote communities across 1.3 million km².",
    googleTrendsGeo: "CA-NT",
    institutions: [],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["yukon", "nunavut", "british-columbia", "alberta", "saskatchewan"],
    lastVerified: "2026-03-31",
  },
  {
    slug: "nunavut",
    name: "Nunavut",
    abbreviation: "NU",
    capital: "Iqaluit",
    population: 0.042,
    populationAsOf: "Jan 1, 2026 (Stats Canada Q4 2025)",
    region: "North",
    description:
      "Nunavut is deploying digital infrastructure to connect its 25 remote communities, with growing interest in AI-assisted health diagnostics and Inuktitut language preservation.",
    googleTrendsGeo: "CA-NU",
    institutions: [],
    sections: {
      stories: true, trends: true, stocks: false, research: false,
      parliament: false, jobs: false, talent: false, startups: false, events: false, regulation: true,
    },
    neighborSlugs: ["northwest-territories", "manitoba", "saskatchewan"],
    lastVerified: "2026-03-31",
  },
]

// ─── Helper functions ────────────────────────────────────────────────────────

export function getProvinceBySlug(slug: string): ProvinceConfig | undefined {
  return PROVINCES.find((p) => p.slug === slug)
}

export function getAllProvinceSlugs(): string[] {
  return PROVINCES.map((p) => p.slug)
}

export const REGION_ORDER: ProvinceRegion[] = ['Atlantic', 'Central', 'Prairies', 'Pacific', 'North']

export const REGION_LABELS: Record<ProvinceRegion, string> = {
  Atlantic:  'Atlantic Canada',
  Central:   'Central Canada',
  Prairies:  'Prairie Provinces',
  Pacific:   'Pacific',
  North:     'Northern Territories',
}
