// Global AI country rankings — curated dataset
// Sources:
// - Stanford HAI AI Index Report 2024
// - Tortoise Global AI Index 2024
// - OECD.AI Policy Observatory
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Stanford HAI publishes annually (April): https://aiindex.stanford.edu
//    - Tortoise updates annually: https://www.tortoisemedia.com/intelligence/global-ai
//    - Last verified: March 2026

export interface CountryAIScore {
  country: string
  countryCode: string
  overall: number
  dimensions: {
    talent: number
    research: number
    development: number
    government: number
    commercial: number
    infrastructure: number
  }
  highlights?: string
}

// Scores normalized 0-100, synthesized from Stanford HAI and Tortoise indices
export const COUNTRY_RANKINGS: CountryAIScore[] = [
  { country: "United States", countryCode: "US", overall: 100, dimensions: { talent: 92, research: 96, development: 100, government: 78, commercial: 100, infrastructure: 95 }, highlights: "Dominant in private investment, frontier models, and compute" },
  { country: "China", countryCode: "CN", overall: 82, dimensions: { talent: 68, research: 88, development: 85, government: 90, commercial: 78, infrastructure: 82 }, highlights: "Leading in AI patents, government strategy, and surveillance AI" },
  { country: "United Kingdom", countryCode: "GB", overall: 68, dimensions: { talent: 72, research: 71, development: 62, government: 82, commercial: 58, infrastructure: 70 }, highlights: "Strong AI safety leadership and DeepMind research" },
  { country: "Canada", countryCode: "CA", overall: 62, dimensions: { talent: 70, research: 68, development: 48, government: 76, commercial: 42, infrastructure: 65 }, highlights: "Pan-Canadian AI Strategy pioneer; strong academic research" },
  { country: "Israel", countryCode: "IL", overall: 60, dimensions: { talent: 65, research: 58, development: 68, government: 62, commercial: 65, infrastructure: 58 }, highlights: "Dense startup ecosystem and defense AI applications" },
  { country: "Germany", countryCode: "DE", overall: 58, dimensions: { talent: 62, research: 65, development: 52, government: 70, commercial: 48, infrastructure: 60 }, highlights: "Industrial AI and manufacturing automation leadership" },
  { country: "France", countryCode: "FR", overall: 56, dimensions: { talent: 60, research: 62, development: 50, government: 68, commercial: 45, infrastructure: 58 }, highlights: "Mistral AI and strong government AI investment" },
  { country: "South Korea", countryCode: "KR", overall: 55, dimensions: { talent: 52, research: 58, development: 60, government: 72, commercial: 50, infrastructure: 62 }, highlights: "Samsung AI and government digital transformation push" },
  { country: "Japan", countryCode: "JP", overall: 52, dimensions: { talent: 48, research: 55, development: 58, government: 65, commercial: 45, infrastructure: 55 }, highlights: "Robotics leadership and AI in manufacturing" },
  { country: "Singapore", countryCode: "SG", overall: 50, dimensions: { talent: 55, research: 45, development: 42, government: 85, commercial: 38, infrastructure: 52 }, highlights: "AI governance pioneer and smart nation initiative" },
  { country: "India", countryCode: "IN", overall: 48, dimensions: { talent: 58, research: 42, development: 45, government: 55, commercial: 52, infrastructure: 35 }, highlights: "Massive AI talent pool and growing startup ecosystem" },
  { country: "Australia", countryCode: "AU", overall: 45, dimensions: { talent: 50, research: 48, development: 38, government: 62, commercial: 35, infrastructure: 48 }, highlights: "Strong AI ethics framework and research councils" },
  { country: "Netherlands", countryCode: "NL", overall: 44, dimensions: { talent: 52, research: 50, development: 35, government: 60, commercial: 32, infrastructure: 50 }, highlights: "EU AI Act implementation leader" },
  { country: "Sweden", countryCode: "SE", overall: 42, dimensions: { talent: 50, research: 48, development: 32, government: 58, commercial: 30, infrastructure: 48 }, highlights: "AI sustainability research and digital governance" },
  { country: "UAE", countryCode: "AE", overall: 40, dimensions: { talent: 35, research: 28, development: 42, government: 82, commercial: 38, infrastructure: 42 }, highlights: "First country with an AI minister; Falcon LLM" },
]

export function getCanadaRanking(): CountryAIScore {
  return COUNTRY_RANKINGS.find((c) => c.countryCode === "CA")!
}

export function getTopCountries(n: number = 10): CountryAIScore[] {
  return COUNTRY_RANKINGS.slice(0, n)
}

export function getCanadaRank(): number {
  return COUNTRY_RANKINGS.findIndex((c) => c.countryCode === "CA") + 1
}

// Data for radar chart comparison
export function getRadarComparison(countryCodes: string[]): { countries: CountryAIScore[]; dimensions: string[] } {
  const countries = countryCodes
    .map((code) => COUNTRY_RANKINGS.find((c) => c.countryCode === code))
    .filter((c): c is CountryAIScore => c !== undefined)

  return {
    countries,
    dimensions: ["Talent", "Research", "Development", "Government", "Commercial", "Infrastructure"],
  }
}
