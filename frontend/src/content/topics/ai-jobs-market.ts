import type { TopicContent } from "@/lib/topic-content"

const aiJobsMarket: TopicContent = {
    slug: "ai-jobs-market",
    updatedAt: "2026-04-18",
    explainerParagraphs: [
        "The Canadian AI jobs market runs on three kinds of signal: posting volume from Job Bank and the major commercial aggregators, headcount disclosures from publicly-traded and VC-backed employers, and migration patterns visible in LinkedIn and immigration data. Each tells a different story and they don't always agree.",
        "Between 2020 and 2023, Canadian AI-adjacent postings — machine learning engineer, data scientist, applied scientist, research engineer — grew faster than any other technology job family. That growth coincided with hyperscaler expansion in Toronto and Montreal and a surge of Series A and B funding into domestic startups. The pattern shifted sharply in 2023–2024 as tech-wide layoffs hit, and again in 2025 as AI-specific hiring rebounded while general software hiring stayed flat.",
        "Compensation data is sparse but directionally clear. Senior ML engineer and research roles in Toronto and Montreal now clear $250,000–$400,000 CAD in total compensation at tier-one employers — materially higher than general software roles, and converging with US West Coast offers net of tax. Mid-level postings cluster in the $120,000–$180,000 CAD band, and applied-research roles at the three institutes run lower but compensate with academic affiliation and IP flexibility.",
        "Geographic concentration is extreme. Greater Toronto accounts for the largest share of AI postings nationally, with Montreal second, Vancouver third, and a long tail across Calgary, Ottawa, Waterloo, and Edmonton. Remote-first employers have blunted but not eliminated the geographic gradient. The Prairies and Atlantic Canada remain underweight relative to their general tech sectors.",
        "Immigration is the other major lever. The Global Talent Stream moves experienced international hires through work-permit processing in two weeks, and the programme is disproportionately used by AI employers. Changes to Express Entry scoring, provincial nominee programmes, and international student pathways all feed into the AI talent pipeline in ways that take months or years to show up in posting data.",
    ],
    whyItMatters: [
        "Hiring velocity is the most practical signal of where enterprise AI adoption is actually happening — beyond announcements and press releases.",
        "Compensation at the top of the market sets a pull factor for Canadian graduates choosing between domestic and US employment, making it a direct input to brain-drain dynamics.",
        "Immigration and student pathways are where federal policy has the most direct leverage over the AI talent supply — changes here ripple through the market for years.",
    ],
    keyPeople: [],
    keyOrgs: [
        { label: "Job Bank Canada", url: "https://www.jobbank.gc.ca/" },
        { label: "Global Talent Stream — IRCC", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/median-wage/high/eligibility/global-talent-stream-categories.html" },
        { label: "Statistics Canada — Labour Force Survey", url: "https://www.statcan.gc.ca/en/subjects-start/labour_" },
    ],
    furtherReading: [
        {
            label: "AI Canada Pulse — Jobs Dashboard",
            url: "/dashboard",
        },
    ],
}

export default aiJobsMarket
