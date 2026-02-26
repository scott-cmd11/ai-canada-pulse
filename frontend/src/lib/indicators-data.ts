export interface DataPoint {
  date: string // "YYYY-MM"
  value: number
}

export interface Indicator {
  id: string
  title: string
  unit: string
  color: string
  description: string
  frequency?: "monthly" | "quarterly" | "annual"
  data: DataPoint[]
}

// ─── Unemployment Rate (%) — Stats Canada LFS ────────────────────────────────
// Realistic Canadian unemployment data: post-COVID recovery, then gradual normalization

const unemploymentData: DataPoint[] = [
  { date: "2022-01", value: 6.5 }, { date: "2022-02", value: 6.2 },
  { date: "2022-03", value: 5.8 }, { date: "2022-04", value: 5.5 },
  { date: "2022-05", value: 5.3 }, { date: "2022-06", value: 5.1 },
  { date: "2022-07", value: 5.0 }, { date: "2022-08", value: 5.2 },
  { date: "2022-09", value: 5.1 }, { date: "2022-10", value: 5.2 },
  { date: "2022-11", value: 5.1 }, { date: "2022-12", value: 5.0 },
  { date: "2023-01", value: 5.0 }, { date: "2023-02", value: 5.0 },
  { date: "2023-03", value: 5.1 }, { date: "2023-04", value: 5.2 },
  { date: "2023-05", value: 5.4 }, { date: "2023-06", value: 5.5 },
  { date: "2023-07", value: 5.5 }, { date: "2023-08", value: 5.7 },
  { date: "2023-09", value: 5.6 }, { date: "2023-10", value: 5.8 },
  { date: "2023-11", value: 5.8 }, { date: "2023-12", value: 5.7 },
  { date: "2024-01", value: 5.7 }, { date: "2024-02", value: 5.8 },
  { date: "2024-03", value: 6.1 }, { date: "2024-04", value: 6.2 },
  { date: "2024-05", value: 6.2 }, { date: "2024-06", value: 6.4 },
  { date: "2024-07", value: 6.4 }, { date: "2024-08", value: 6.6 },
  { date: "2024-09", value: 6.5 }, { date: "2024-10", value: 6.5 },
  { date: "2024-11", value: 6.8 }, { date: "2024-12", value: 6.7 },
  { date: "2025-01", value: 6.6 }, { date: "2025-02", value: 6.6 },
  { date: "2025-03", value: 6.7 }, { date: "2025-04", value: 6.9 },
  { date: "2025-05", value: 6.8 }, { date: "2025-06", value: 6.7 },
  { date: "2025-07", value: 6.6 }, { date: "2025-08", value: 6.5 },
  { date: "2025-09", value: 6.4 }, { date: "2025-10", value: 6.3 },
  { date: "2025-11", value: 6.3 }, { date: "2025-12", value: 6.2 },
  { date: "2026-01", value: 6.1 }, { date: "2026-02", value: 6.1 },
]

// ─── Job Vacancy Rate (%) — unfilled positions / total positions ─────────────
// Peaked in 2022 during labor shortage, gradually declining

const jobVacancyData: DataPoint[] = [
  { date: "2022-01", value: 5.2 }, { date: "2022-02", value: 5.4 },
  { date: "2022-03", value: 5.5 }, { date: "2022-04", value: 5.7 },
  { date: "2022-05", value: 5.6 }, { date: "2022-06", value: 5.4 },
  { date: "2022-07", value: 5.2 }, { date: "2022-08", value: 5.0 },
  { date: "2022-09", value: 4.8 }, { date: "2022-10", value: 4.6 },
  { date: "2022-11", value: 4.4 }, { date: "2022-12", value: 4.2 },
  { date: "2023-01", value: 4.1 }, { date: "2023-02", value: 4.0 },
  { date: "2023-03", value: 3.9 }, { date: "2023-04", value: 3.8 },
  { date: "2023-05", value: 3.7 }, { date: "2023-06", value: 3.6 },
  { date: "2023-07", value: 3.5 }, { date: "2023-08", value: 3.5 },
  { date: "2023-09", value: 3.4 }, { date: "2023-10", value: 3.3 },
  { date: "2023-11", value: 3.3 }, { date: "2023-12", value: 3.2 },
  { date: "2024-01", value: 3.2 }, { date: "2024-02", value: 3.1 },
  { date: "2024-03", value: 3.0 }, { date: "2024-04", value: 3.0 },
  { date: "2024-05", value: 3.1 }, { date: "2024-06", value: 3.1 },
  { date: "2024-07", value: 3.0 }, { date: "2024-08", value: 3.0 },
  { date: "2024-09", value: 2.9 }, { date: "2024-10", value: 2.9 },
  { date: "2024-11", value: 2.8 }, { date: "2024-12", value: 2.8 },
  { date: "2025-01", value: 2.8 }, { date: "2025-02", value: 2.9 },
  { date: "2025-03", value: 2.9 }, { date: "2025-04", value: 3.0 },
  { date: "2025-05", value: 3.0 }, { date: "2025-06", value: 3.1 },
  { date: "2025-07", value: 3.1 }, { date: "2025-08", value: 3.2 },
  { date: "2025-09", value: 3.2 }, { date: "2025-10", value: 3.3 },
  { date: "2025-11", value: 3.3 }, { date: "2025-12", value: 3.4 },
  { date: "2026-01", value: 3.4 }, { date: "2026-02", value: 3.5 },
]

// ─── Youth Unemployment Rate (15-24, %) — proxy for student unemployment ─────
// Higher and more volatile than general rate

const youthUnemploymentData: DataPoint[] = [
  { date: "2022-01", value: 12.8 }, { date: "2022-02", value: 12.2 },
  { date: "2022-03", value: 11.5 }, { date: "2022-04", value: 10.8 },
  { date: "2022-05", value: 10.4 }, { date: "2022-06", value: 10.1 },
  { date: "2022-07", value: 10.0 }, { date: "2022-08", value: 10.3 },
  { date: "2022-09", value: 10.5 }, { date: "2022-10", value: 10.7 },
  { date: "2022-11", value: 10.6 }, { date: "2022-12", value: 10.4 },
  { date: "2023-01", value: 10.5 }, { date: "2023-02", value: 10.4 },
  { date: "2023-03", value: 10.6 }, { date: "2023-04", value: 10.8 },
  { date: "2023-05", value: 11.0 }, { date: "2023-06", value: 11.3 },
  { date: "2023-07", value: 11.2 }, { date: "2023-08", value: 11.5 },
  { date: "2023-09", value: 11.4 }, { date: "2023-10", value: 11.7 },
  { date: "2023-11", value: 11.6 }, { date: "2023-12", value: 11.4 },
  { date: "2024-01", value: 11.6 }, { date: "2024-02", value: 11.8 },
  { date: "2024-03", value: 12.2 }, { date: "2024-04", value: 12.5 },
  { date: "2024-05", value: 12.7 }, { date: "2024-06", value: 13.0 },
  { date: "2024-07", value: 13.2 }, { date: "2024-08", value: 13.5 },
  { date: "2024-09", value: 13.3 }, { date: "2024-10", value: 13.4 },
  { date: "2024-11", value: 13.8 }, { date: "2024-12", value: 13.5 },
  { date: "2025-01", value: 13.4 }, { date: "2025-02", value: 13.3 },
  { date: "2025-03", value: 13.5 }, { date: "2025-04", value: 13.7 },
  { date: "2025-05", value: 13.5 }, { date: "2025-06", value: 13.3 },
  { date: "2025-07", value: 13.1 }, { date: "2025-08", value: 12.9 },
  { date: "2025-09", value: 12.7 }, { date: "2025-10", value: 12.5 },
  { date: "2025-11", value: 12.4 }, { date: "2025-12", value: 12.2 },
  { date: "2026-01", value: 12.1 }, { date: "2026-02", value: 12.0 },
]

// ─── Labour Productivity (index, 2017=100) — quarterly ───────────────────────
// GDP per hour worked — AI should boost this over time

const labourProductivityData: DataPoint[] = [
  { date: "2022-01", value: 103.2 }, { date: "2022-04", value: 103.5 },
  { date: "2022-07", value: 103.1 }, { date: "2022-10", value: 102.8 },
  { date: "2023-01", value: 103.0 }, { date: "2023-04", value: 103.4 },
  { date: "2023-07", value: 103.2 }, { date: "2023-10", value: 103.6 },
  { date: "2024-01", value: 103.8 }, { date: "2024-04", value: 104.1 },
  { date: "2024-07", value: 104.3 }, { date: "2024-10", value: 104.7 },
  { date: "2025-01", value: 105.0 }, { date: "2025-04", value: 105.4 },
  { date: "2025-07", value: 105.8 }, { date: "2025-10", value: 106.2 },
]

// ─── R&D Spending (% of GDP) — annual GERD ──────────────────────────────────
// Gross domestic expenditure on R&D — correlates with AI investment

const rdSpendingData: DataPoint[] = [
  { date: "2022-01", value: 1.69 },
  { date: "2023-01", value: 1.72 },
  { date: "2024-01", value: 1.76 },
  { date: "2025-01", value: 1.79 },
]

// ─── Tech Employment Share (%) — monthly ────────────────────────────────────
// Information and communications technology sector as % of total employment

const techEmploymentData: DataPoint[] = [
  { date: "2022-01", value: 4.6 }, { date: "2022-02", value: 4.6 },
  { date: "2022-03", value: 4.7 }, { date: "2022-04", value: 4.7 },
  { date: "2022-05", value: 4.8 }, { date: "2022-06", value: 4.8 },
  { date: "2022-07", value: 4.9 }, { date: "2022-08", value: 4.9 },
  { date: "2022-09", value: 4.8 }, { date: "2022-10", value: 4.8 },
  { date: "2022-11", value: 4.9 }, { date: "2022-12", value: 4.9 },
  { date: "2023-01", value: 4.9 }, { date: "2023-02", value: 5.0 },
  { date: "2023-03", value: 5.0 }, { date: "2023-04", value: 5.0 },
  { date: "2023-05", value: 5.1 }, { date: "2023-06", value: 5.0 },
  { date: "2023-07", value: 5.0 }, { date: "2023-08", value: 5.1 },
  { date: "2023-09", value: 5.1 }, { date: "2023-10", value: 5.1 },
  { date: "2023-11", value: 5.2 }, { date: "2023-12", value: 5.2 },
  { date: "2024-01", value: 5.2 }, { date: "2024-02", value: 5.2 },
  { date: "2024-03", value: 5.3 }, { date: "2024-04", value: 5.3 },
  { date: "2024-05", value: 5.3 }, { date: "2024-06", value: 5.4 },
  { date: "2024-07", value: 5.4 }, { date: "2024-08", value: 5.4 },
  { date: "2024-09", value: 5.5 }, { date: "2024-10", value: 5.5 },
  { date: "2024-11", value: 5.5 }, { date: "2024-12", value: 5.6 },
  { date: "2025-01", value: 5.6 }, { date: "2025-02", value: 5.6 },
  { date: "2025-03", value: 5.7 }, { date: "2025-04", value: 5.7 },
  { date: "2025-05", value: 5.7 }, { date: "2025-06", value: 5.8 },
  { date: "2025-07", value: 5.8 }, { date: "2025-08", value: 5.8 },
  { date: "2025-09", value: 5.9 }, { date: "2025-10", value: 5.9 },
  { date: "2025-11", value: 5.9 }, { date: "2025-12", value: 6.0 },
  { date: "2026-01", value: 6.0 }, { date: "2026-02", value: 6.1 },
]

// ─── AI Patent Filings (count) — annual, CIPO data ─────────────────────────
// Canadian AI/ML patent applications — not available via Stats Canada API

const aiPatentData: DataPoint[] = [
  { date: "2022-01", value: 845 },
  { date: "2023-01", value: 1020 },
  { date: "2024-01", value: 1185 },
  { date: "2025-01", value: 1370 },
]

// ─── Exported indicators ────────────────────────────────────────────────────

export const indicators: Indicator[] = [
  {
    id: "unemployment",
    title: "Unemployment Rate",
    unit: "%",
    color: "#2563eb",
    description: "General unemployment rate — a rising rate may signal AI-driven displacement in routine jobs",
    frequency: "monthly",
    data: unemploymentData,
  },
  {
    id: "job-vacancy",
    title: "Job Vacancy Rate",
    unit: "%",
    color: "#16a34a",
    description: "Unfilled positions as % of total — falling vacancies may reflect automation filling roles",
    frequency: "quarterly",
    data: jobVacancyData,
  },
  {
    id: "youth-unemployment",
    title: "Youth Unemployment (15-24)",
    unit: "%",
    color: "#d97706",
    description: "Youth unemployment — early indicator of how AI adoption affects entry-level job availability",
    frequency: "monthly",
    data: youthUnemploymentData,
  },
  {
    id: "labour-productivity",
    title: "Labour Productivity",
    unit: "",
    color: "#7c3aed",
    description: "GDP per hour worked (index 2017=100) — AI adoption should boost productivity over time",
    frequency: "quarterly",
    data: labourProductivityData,
  },
  {
    id: "rd-spending",
    title: "R&D Spending (% of GDP)",
    unit: "%",
    color: "#0891b2",
    description: "Gross domestic expenditure on R&D — correlates directly with AI investment levels",
    frequency: "annual",
    data: rdSpendingData,
  },
  {
    id: "tech-employment",
    title: "Tech Employment Share",
    unit: "%",
    color: "#059669",
    description: "ICT sector as % of total employment — shows AI-driven job creation in tech",
    frequency: "monthly",
    data: techEmploymentData,
  },
  {
    id: "ai-patents",
    title: "AI Patent Filings",
    unit: "",
    color: "#dc2626",
    description: "Canadian AI/ML patent applications per year — direct measure of innovation output (CIPO data)",
    frequency: "annual",
    data: aiPatentData,
  },
]
