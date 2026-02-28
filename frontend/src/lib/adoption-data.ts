// Real data from Statistics Canada surveys and Treasury Board of Canada reports
// Sources:
// - Statistics Canada, "Artificial intelligence and Canadian businesses" (11-621-m, Q2 2025)
// - Treasury Board of Canada Secretariat, "AI in the Government of Canada" (2024)
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Stats Canada 11-621-m releases quarterly: check https://www150.statcan.gc.ca/n1/en/catalogue/11-621-M
//    - Treasury Board reports annually: check https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai.html
//    - Last verified: February 2026

export interface AdoptionDataPoint {
  sector: string
  percentage: number
  source: string
  year: number
  quarter?: string
}

// Private sector adoption by industry (Stats Canada 11-621-m, Q2 2025)
export const privateSectorAdoption: AdoptionDataPoint[] = [
  { sector: "Information & cultural industries", percentage: 35.6, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Professional, scientific & technical", percentage: 31.7, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Finance & insurance", percentage: 30.6, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Wholesale trade", percentage: 17.8, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Manufacturing", percentage: 15.2, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Retail trade", percentage: 8.4, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Transportation & warehousing", percentage: 7.1, source: "Statistics Canada", year: 2025, quarter: "Q2" },
  { sector: "Health care & social assistance", percentage: 5.8, source: "Statistics Canada", year: 2025, quarter: "Q2" },
]

// Government sector adoption (Treasury Board)
export const governmentAdoption: AdoptionDataPoint[] = [
  { sector: "Federal departments (using AI)", percentage: 20, source: "Treasury Board of Canada", year: 2024 },
  { sector: "Federal roles with AI exposure", percentage: 74, source: "Treasury Board of Canada", year: 2024 },
  { sector: "Provincial/territorial (active pilots)", percentage: 35, source: "ISED Canada", year: 2024 },
]

// Overall comparison
export const overallComparison = {
  privateSector: {
    label: "Private Sector",
    adoptionRate: 12.2,
    source: "Statistics Canada, 11-621-m",
    year: 2025,
    quarter: "Q2",
    note: "Generative AI comprises ~73% of all AI tools used",
  },
  publicSector: {
    label: "Public Sector",
    adoptionRate: 20,
    source: "Treasury Board of Canada Secretariat",
    year: 2024,
  },
}
