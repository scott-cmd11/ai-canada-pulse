// Canadian AI startups — curated dataset
// Sources:
// - BetaKit, The Logic, company announcements
// - CIFAR Pan-Canadian AI Strategy ecosystem reports
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Review quarterly for new funding rounds and exits
//    - Last verified: March 2026

export type StartupSector =
  | "NLP & LLMs"
  | "Computer Vision"
  | "Robotics"
  | "Healthcare AI"
  | "FinTech AI"
  | "Quantum ML"
  | "Enterprise AI"
  | "Autonomous Systems"
  | "AI Infrastructure"
  | "Conversational AI"
  | "Cybersecurity AI"
  | "Climate & Energy AI"
  | "AI Chips"
  | "Search & Discovery"
  | "Creative AI"
  | "EdTech AI"

export type FundingStage = "Seed" | "Series A" | "Series B" | "Series C" | "Series D+" | "Public" | "Acquired" | "Growth"

export interface CanadianStartup {
  name: string
  city: string
  province: string
  provinceSlug: string
  sector: StartupSector
  stage: FundingStage
  foundedYear: number
  url: string
  description: string
  lastVerified: string  // ISO date, e.g. "2026-03-28"
}

export const STARTUPS: CanadianStartup[] = [
  // Ontario — Toronto
  { name: "Cohere", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "NLP & LLMs", stage: "Series D+", foundedYear: 2019, url: "https://cohere.com", description: "Enterprise LLM platform for text generation, search, and classification" },
  { name: "Ada", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Conversational AI", stage: "Series C", foundedYear: 2016, url: "https://ada.cx", description: "AI-powered customer service automation platform" },
  { name: "Waabi", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Autonomous Systems", stage: "Series B", foundedYear: 2021, url: "https://waabi.ai", description: "Generative AI for autonomous driving, founded by Raquel Urtasun" },
  { name: "Untether AI", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "AI Chips", stage: "Series B", foundedYear: 2018, url: "https://www.untether.ai", description: "At-memory compute architecture for AI inference acceleration" },
  { name: "Xanadu", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Quantum ML", stage: "Series C", foundedYear: 2016, url: "https://xanadu.ai", description: "Photonic quantum computing with PennyLane ML framework" },
  { name: "BenchSci", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Healthcare AI", stage: "Series D+", foundedYear: 2015, url: "https://benchsci.com", description: "AI-assisted antibody selection for preclinical research" },
  { name: "Borealis AI", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "FinTech AI", stage: "Growth", foundedYear: 2016, url: "https://www.borealisai.com", description: "RBC's AI research institute applying ML to financial services" },
  { name: "Layer 6 AI", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "FinTech AI", stage: "Acquired", foundedYear: 2016, url: "https://layer6.ai", description: "Deep learning for personalization (acquired by TD Bank)" },
  { name: "Dessa", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "AI Infrastructure", stage: "Acquired", foundedYear: 2016, url: "https://dessa.com", description: "ML experiment tracking and deployment (acquired by Square)" },
  { name: "Integrate.ai", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Series A", foundedYear: 2017, url: "https://integrate.ai", description: "Federated learning platform for privacy-preserving ML" },
  { name: "Properly", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Series A", foundedYear: 2018, url: "https://properly.ca", description: "AI-powered real estate valuation and transaction platform" },
  { name: "Deeplearni.ng", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "AI Infrastructure", stage: "Acquired", foundedYear: 2014, url: "https://deeplearni.ng", description: "Deep learning platform (acquired by DarwinAI/Apple)" },
  { name: "DarwinAI", city: "Waterloo", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Acquired", foundedYear: 2017, url: "https://darwinai.com", description: "Explainable AI for manufacturing (acquired by Apple)" },
  { name: "Mappedin", city: "Waterloo", province: "Ontario", provinceSlug: "ontario", sector: "Computer Vision", stage: "Series B", foundedYear: 2011, url: "https://mappedin.com", description: "Indoor mapping and wayfinding with AI-powered analytics" },
  { name: "Kindred", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Robotics", stage: "Acquired", foundedYear: 2014, url: "https://kindred.ai", description: "AI-powered robotic picking for e-commerce (acquired by Ocado)" },
  { name: "Shopify", city: "Ottawa", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Public", foundedYear: 2006, url: "https://shopify.engineering", description: "E-commerce platform with extensive AI features (Sidekick, Magic)" },
  { name: "Kinaxis", city: "Ottawa", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Public", foundedYear: 1984, url: "https://kinaxis.com", description: "AI-driven supply chain management and planning" },
  { name: "BlackBerry", city: "Waterloo", province: "Ontario", provinceSlug: "ontario", sector: "Cybersecurity AI", stage: "Public", foundedYear: 1984, url: "https://blackberry.com", description: "Cylance AI-powered endpoint security and IoT platform" },
  { name: "Docebo", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "EdTech AI", stage: "Public", foundedYear: 2005, url: "https://docebo.com", description: "AI-powered learning management and skills development" },
  { name: "OpenText", city: "Waterloo", province: "Ontario", provinceSlug: "ontario", sector: "Enterprise AI", stage: "Public", foundedYear: 1991, url: "https://opentext.com", description: "Information management with AI content analytics" },
  { name: "Think Research", city: "Toronto", province: "Ontario", provinceSlug: "ontario", sector: "Healthcare AI", stage: "Public", foundedYear: 2006, url: "https://thinkresearch.com", description: "AI clinical decision support and digital health" },

  // Quebec — Montreal
  { name: "Coveo", city: "Quebec City", province: "Quebec", provinceSlug: "quebec", sector: "Search & Discovery", stage: "Public", foundedYear: 2005, url: "https://coveo.com", description: "AI-powered enterprise search and relevance platform" },
  { name: "Element AI", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Enterprise AI", stage: "Acquired", foundedYear: 2016, url: "https://elementai.com", description: "AI solutions factory (acquired by ServiceNow)" },
  { name: "Dialogue", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Healthcare AI", stage: "Public", foundedYear: 2016, url: "https://dialogue.co", description: "AI-powered virtual healthcare and wellness platform" },
  { name: "Lightspeed Commerce", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Enterprise AI", stage: "Public", foundedYear: 2005, url: "https://lightspeedcommerce.com", description: "Commerce platform with AI analytics for retail and hospitality" },
  { name: "Breeze", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "FinTech AI", stage: "Series A", foundedYear: 2020, url: "https://breeze.ai", description: "AI-first insurance underwriting platform" },
  { name: "Mnubo", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Enterprise AI", stage: "Acquired", foundedYear: 2012, url: "https://mnubo.com", description: "IoT analytics platform with ML (acquired by Aspen Technology)" },
  { name: "Deeplite", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "AI Infrastructure", stage: "Series A", foundedYear: 2017, url: "https://deeplite.com", description: "Neural network optimization for edge AI deployment" },
  { name: "Imagia", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Healthcare AI", stage: "Series A", foundedYear: 2015, url: "https://imagia.com", description: "AI radiomics for cancer detection and characterization" },
  { name: "Stradigi AI", city: "Montreal", province: "Quebec", provinceSlug: "quebec", sector: "Enterprise AI", stage: "Series A", foundedYear: 2017, url: "https://stradigi.ai", description: "Kepler no-code AI platform for business applications" },

  // British Columbia — Vancouver
  { name: "D-Wave Systems", city: "Burnaby", province: "British Columbia", provinceSlug: "british-columbia", sector: "Quantum ML", stage: "Public", foundedYear: 1999, url: "https://dwavesys.com", description: "World's first commercial quantum computing company" },
  { name: "Sanctuary AI", city: "Vancouver", province: "British Columbia", provinceSlug: "british-columbia", sector: "Robotics", stage: "Series B", foundedYear: 2018, url: "https://sanctuary.ai", description: "General-purpose humanoid robots with human-like intelligence" },
  { name: "Clio", city: "Burnaby", province: "British Columbia", provinceSlug: "british-columbia", sector: "Enterprise AI", stage: "Series D+", foundedYear: 2008, url: "https://clio.com", description: "Legal tech with AI-powered practice management (CoPilot)" },
  { name: "Finger Food Studios", city: "Vancouver", province: "British Columbia", provinceSlug: "british-columbia", sector: "Creative AI", stage: "Acquired", foundedYear: 2009, url: "https://fingerfoodstudios.com", description: "Spatial computing and AI visualization (acquired by Unity)" },
  { name: "BrainStation", city: "Vancouver", province: "British Columbia", provinceSlug: "british-columbia", sector: "EdTech AI", stage: "Growth", foundedYear: 2012, url: "https://brainstation.io", description: "Digital skills bootcamps including AI and data science" },
  { name: "Terramera", city: "Vancouver", province: "British Columbia", provinceSlug: "british-columbia", sector: "Climate & Energy AI", stage: "Series B", foundedYear: 2010, url: "https://terramera.com", description: "AI-powered clean agriculture technology" },

  // Alberta — Edmonton & Calgary
  { name: "AltaML", city: "Edmonton", province: "Alberta", provinceSlug: "alberta", sector: "Enterprise AI", stage: "Growth", foundedYear: 2018, url: "https://altaml.com", description: "Applied AI solutions with Amii partnership" },
  { name: "Drivewyze", city: "Edmonton", province: "Alberta", provinceSlug: "alberta", sector: "Autonomous Systems", stage: "Growth", foundedYear: 2010, url: "https://drivewyze.com", description: "AI-powered commercial vehicle safety and weigh station bypass" },
  { name: "Mphasis Stelligent", city: "Calgary", province: "Alberta", provinceSlug: "alberta", sector: "AI Infrastructure", stage: "Acquired", foundedYear: 2015, url: "https://stelligent.com", description: "Cloud infrastructure automation with ML optimization" },

  // Atlantic Canada
  { name: "Eigen Innovations", city: "Fredericton", province: "New Brunswick", provinceSlug: "new-brunswick", sector: "Computer Vision", stage: "Series A", foundedYear: 2012, url: "https://eigeninnovations.com", description: "Thermal imaging AI for manufacturing quality control" },
  { name: "Myra Labs", city: "Halifax", province: "Nova Scotia", provinceSlug: "nova-scotia", sector: "Enterprise AI", stage: "Seed", foundedYear: 2020, url: "https://myralabs.com", description: "AI workflow automation for enterprise operations" },
]

export function getStartupsByProvince(provinceSlug: string): CanadianStartup[] {
  return STARTUPS.filter((s) => s.provinceSlug === provinceSlug)
}

export function getStartupsBySector(sector: StartupSector): CanadianStartup[] {
  return STARTUPS.filter((s) => s.sector === sector)
}

export function getStartupStats() {
  const bySector = STARTUPS.reduce<Record<string, number>>((acc, s) => {
    acc[s.sector] = (acc[s.sector] || 0) + 1
    return acc
  }, {})

  const byStage = STARTUPS.reduce<Record<string, number>>((acc, s) => {
    acc[s.stage] = (acc[s.stage] || 0) + 1
    return acc
  }, {})

  const byProvince = STARTUPS.reduce<Record<string, number>>((acc, s) => {
    acc[s.province] = (acc[s.province] || 0) + 1
    return acc
  }, {})

  return { total: STARTUPS.length, bySector, byStage, byProvince }
}
