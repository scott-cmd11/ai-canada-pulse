// ─── Province Configuration ──────────────────────────────────────────────────
// Foundation config for all provincial pages, the Canada map component,
// and API filtering. Each entry describes one province/territory region.

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
  /** Google Trends geo code (e.g. "CA-ON") */
  googleTrendsGeo: string
  institutions: InstitutionConfig[]
  sections: ProvinceSections
  neighborSlugs: string[]
  /** Only present for the Northern Territories aggregate entry */
  subRegions?: string[]
  lastVerified: string  // ISO date, e.g. "2026-03-28"
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
      "Canada's most populous province. Home to Vector Institute and CIFAR — two of three Pan-Canadian AI institutes.",
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
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
      talent: true,
      startups: true,
      events: true,
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
      "Home to Mila, the world's largest academic deep-learning research institute.",
    googleTrendsGeo: "CA-QC",
    institutions: [
      { name: "Mila", type: "institute", url: "https://mila.quebec" },
      { name: "McGill University", type: "university", url: "https://www.cs.mcgill.ca" },
      { name: "Université de Montréal", type: "university", url: "https://diro.umontreal.ca" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
      talent: true,
      startups: true,
      events: true,
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
      "Home to D-Wave Systems, a global leader in quantum computing, and two major research universities.",
    googleTrendsGeo: "CA-BC",
    institutions: [
      { name: "University of British Columbia", type: "university", url: "https://www.cs.ubc.ca" },
      { name: "Simon Fraser University", type: "university", url: "https://www.sfu.ca/computing.html" },
      { name: "D-Wave", type: "company", url: "https://www.dwavesys.com" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
      talent: true,
      startups: true,
      events: true,
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
      "Home to Amii, the third Pan-Canadian AI institute, at the University of Alberta.",
    googleTrendsGeo: "CA-AB",
    institutions: [
      { name: "Amii", type: "institute", url: "https://amii.ca" },
      { name: "University of Alberta", type: "university", url: "https://www.ualberta.ca/computing-science" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: true,
      research: true,
      parliament: true,
      jobs: true,
      talent: true,
      startups: true,
      events: true,
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
      "The University of Saskatchewan hosts AI research programs focused on agriculture and natural resources.",
    googleTrendsGeo: "CA-SK",
    institutions: [
      { name: "University of Saskatchewan", type: "university", url: "https://cs.usask.ca" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "The University of Manitoba has growing AI and data science research programs.",
    googleTrendsGeo: "CA-MB",
    institutions: [
      { name: "University of Manitoba", type: "university", url: "https://sci.umanitoba.ca/cs" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "Dalhousie University leads AI research in Atlantic Canada with a focus on ocean technology.",
    googleTrendsGeo: "CA-NS",
    institutions: [
      { name: "Dalhousie University", type: "university", url: "https://www.dal.ca/faculty/computerscience.html" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "The University of New Brunswick hosts the Canadian Institute for Cybersecurity.",
    googleTrendsGeo: "CA-NB",
    institutions: [
      { name: "University of New Brunswick", type: "university", url: "https://www.unb.ca/cic" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "Memorial University conducts AI research applied to ocean science and offshore energy.",
    googleTrendsGeo: "CA-NL",
    institutions: [
      { name: "Memorial University of Newfoundland", type: "university", url: "https://www.mun.ca/computerscience" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "The University of Prince Edward Island has emerging computer science programs.",
    googleTrendsGeo: "CA-PE",
    institutions: [
      { name: "University of Prince Edward Island", type: "university", url: "https://www.upei.ca/programs/computer-science" },
    ],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
      "Canada's three northern territories have limited but growing digital infrastructure.",
    googleTrendsGeo: "CA",
    institutions: [],
    sections: {
      stories: true,
      trends: true,
      stocks: false,
      research: false,
      parliament: false,
      jobs: false,
      talent: false,
      startups: false,
      events: false,
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
