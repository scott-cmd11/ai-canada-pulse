import type {
    FeedItem,
    KPIsResponse,
    EChartsResponse,
    SourcesBreakdownResponse,
    JurisdictionsBreakdownResponse,
    EntitiesBreakdownResponse,
    TagsBreakdownResponse,
    StatsBriefResponse,
    ScopeCompareResponse,
    ConfidenceProfileResponse,
    ConcentrationResponse,
    MomentumResponse,
    RiskIndexResponse,
    EntityMomentumResponse,
    RiskTrendResponse,
    SummaryResponse,
    CoverageResponse,
    Category,
    TimeWindow
} from "./types";

const NOW = new Date().toISOString();
const WINDOW: TimeWindow = "7d";

export const MOCK_KPIs: KPIsResponse = {
    m15: { current: 12, previous: 10, delta_percent: 20 },
    h1: { current: 45, previous: 40, delta_percent: 12.5 },
    d7: { current: 342, previous: 310, delta_percent: 10.3 },
};

export const MOCK_FEED_ITEMS: FeedItem[] = [
    {
        id: "mock-1",
        source_id: "gov-can-1",
        source_type: "Official",
        category: "policy",
        title: "Canada Announces $2.4B AI Compute Sovereign Cloud Initiative",
        url: "https://example.com/1",
        publisher: "Government of Canada",
        published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "National",
        entities: ["ISED", "Compute Canada"],
        tags: ["infrastructure", "funding", "sovereignty"],
        hash: "abc1",
        confidence: 0.95,
    },
    {
        id: "mock-2",
        source_id: "tech-crunch-1",
        source_type: "News",
        category: "industry",
        title: "Cohere Releases Command R+ v2 with Enhanced Multilingual Support",
        url: "https://example.com/2",
        publisher: "TechCrunch",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Ontario",
        entities: ["Cohere", "Command R+"],
        tags: ["LLM", "Enterprise", "RAG"],
        hash: "abc2",
        confidence: 0.92,
    },
    {
        id: "mock-3",
        source_id: "mila-1",
        source_type: "Institute",
        category: "research",
        title: "Mila Researchers Propose New 'Liquid' Neural Network Architecture",
        url: "https://example.com/3",
        publisher: "Mila News",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Quebec",
        entities: ["Mila", "Ramin Hasani"],
        tags: ["Neural Networks", "Efficiency"],
        hash: "abc3",
        confidence: 0.88,
    },
    {
        id: "mock-4",
        source_id: "cbc-1",
        source_type: "News",
        category: "policy",
        title: "Bill C-27 Committee Hearings Resume with Focus on AIDA",
        url: "https://example.com/4",
        publisher: "CBC News",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "National",
        entities: ["INDU Committee", "Privacy Commissioner"],
        tags: ["Bill C-27", "Privacy", "AIDA"],
        hash: "abc4",
        confidence: 0.90,
    },
    {
        id: "mock-5",
        source_id: "vector-1",
        source_type: "Institute",
        category: "industry",
        title: "Vector Institute Partners with 5 Major Hospitals for AI Health",
        url: "https://example.com/5",
        publisher: "Vector Institute",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Ontario",
        entities: ["Vector Institute", "UHN"],
        tags: ["Healthcare", "Predictive"],
        hash: "abc5",
        confidence: 0.85,
    },
    {
        id: "mock-6-world",
        source_id: "nyt-1",
        source_type: "News",
        category: "policy",
        title: "White House Issues New Executive Order on AI Safety",
        url: "https://example.com/us-1",
        publisher: "NYT",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "United States",
        entities: ["White House", "Joe Biden"],
        tags: ["Regulation", "Safety"],
        hash: "abc6",
        confidence: 0.98,
    },
    {
        id: "mock-7-world",
        source_id: "eu-1",
        source_type: "Official",
        category: "policy",
        title: "EU AI Act Enters Final Stages of Implementation",
        url: "https://example.com/eu-1",
        publisher: "European Commission",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "European Union",
        entities: ["EU Parliament"],
        tags: ["AI Act", "Compliance"],
        hash: "abc7",
        confidence: 0.96,
    },
    {
        id: "mock-8-world",
        source_id: "uk-1",
        source_type: "News",
        category: "policy",
        title: "UK Launches AI Safety Institute Global Partnership Network",
        url: "https://example.com/uk-1",
        publisher: "BBC",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "United Kingdom",
        entities: ["AISI", "DSIT"],
        tags: ["Safety", "International"],
        hash: "abc8",
        confidence: 0.94,
    },
    {
        id: "mock-9-world",
        source_id: "jp-1",
        source_type: "News",
        category: "research",
        title: "Japan\u2019s RIKEN Unveils Next-Generation Foundation Model",
        url: "https://example.com/jp-1",
        publisher: "Nikkei Asia",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Japan",
        entities: ["RIKEN", "Fugaku"],
        tags: ["LLM", "Foundation Model"],
        hash: "abc9",
        confidence: 0.91,
    },
    {
        id: "mock-10-world",
        source_id: "in-1",
        source_type: "Official",
        category: "funding",
        title: "India Commits $1.25B to National AI Mission Expansion",
        url: "https://example.com/in-1",
        publisher: "The Hindu",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "India",
        entities: ["MeitY", "IndiaAI"],
        tags: ["Funding", "National Strategy"],
        hash: "abc10",
        confidence: 0.89,
    },
    {
        id: "mock-11-world",
        source_id: "au-1",
        source_type: "News",
        category: "industry",
        title: "Australia\u2019s CSIRO Partners with Google on Responsible AI Framework",
        url: "https://example.com/au-1",
        publisher: "The Australian",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Australia",
        entities: ["CSIRO", "Google DeepMind"],
        tags: ["Responsible AI", "Partnership"],
        hash: "abc11",
        confidence: 0.87,
    },
    {
        id: "mock-12-world",
        source_id: "sg-1",
        source_type: "Official",
        category: "policy",
        title: "Singapore Updates Model AI Governance Framework for Generative AI",
        url: "https://example.com/sg-1",
        publisher: "IMDA",
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        ingested_at: NOW,
        language: "en",
        jurisdiction: "Singapore",
        entities: ["IMDA", "PDPC"],
        tags: ["Governance", "GenAI"],
        hash: "abc12",
        confidence: 0.93,
    }
];

const now = new Date();
const hours = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setHours(d.getHours() - (5 - i) * 4);
    return d.toISOString();
});

export const MOCK_HOURLY: EChartsResponse = {
    legend: ["policy", "research", "industry", "funding", "news", "incidents"],
    xAxis: hours,
    series: [
        { name: "policy", type: "line", data: [2, 3, 10, 15, 12, 5] },
        { name: "research", type: "line", data: [1, 1, 5, 8, 6, 3] },
        { name: "industry", type: "line", data: [1, 2, 6, 12, 8, 4] },
        { name: "funding", type: "line", data: [0, 1, 2, 5, 3, 1] },
        { name: "news", type: "line", data: [1, 1, 2, 4, 1, 2] },
        { name: "incidents", type: "line", data: [0, 0, 0, 1, 0, 0] }
    ],
};

const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString();
});

export const MOCK_WEEKLY: EChartsResponse = {
    legend: ["Items"],
    xAxis: days,
    series: [{ name: "Items", type: "bar", data: [45, 52, 38, 65, 48, 20, 15] }],
};

export const MOCK_SOURCES: SourcesBreakdownResponse = {
    time_window: WINDOW,
    total: 154,
    publishers: [
        { name: "Google News", count: 45 },
        { name: "CBC", count: 22 },
        { name: "Mila", count: 15 },
        { name: "Vector Institute", count: 12 },
        { name: "Government of Canada", count: 10 },
    ],
    source_types: [
        { name: "News", count: 80 },
        { name: "Official", count: 40 },
        { name: "Institute", count: 34 },
    ]
};

export const MOCK_JURISDICTIONS: JurisdictionsBreakdownResponse = {
    time_window: WINDOW,
    total: 135,
    jurisdictions: [
        { name: "National", count: 45 },
        { name: "Ontario", count: 38 },
        { name: "Quebec", count: 25 },
        { name: "British Columbia", count: 15 },
        { name: "Alberta", count: 12 },
    ],
};

export const MOCK_ENTITIES: EntitiesBreakdownResponse = {
    time_window: WINDOW,
    total: 200,
    entities: [
        { name: "Cohere", count: 28 },
        { name: "OpenAI", count: 25 },
        { name: "Justin Trudeau", count: 15 },
        { name: "Geoffrey Hinton", count: 12 },
        { name: "Yoshua Bengio", count: 10 },
    ],
};

export const MOCK_TAGS: TagsBreakdownResponse = {
    time_window: WINDOW,
    total: 300,
    tags: [
        { name: "Generative AI", count: 55 },
        { name: "Regulation", count: 42 },
        { name: "Funding", count: 30 },
        { name: "Healthcare", count: 25 },
        { name: "Ethics", count: 18 },
    ],
};

export const MOCK_BRIEF: StatsBriefResponse = {
    generated_at: NOW,
    time_window: "24h",
    total_items: 12,
    high_alert_count: 3,
    top_category: { name: "policy", count: 5 },
    top_jurisdiction: { name: "National", count: 4 },
    top_publisher: { name: "CBC", count: 3 },
    top_tag: { name: "Bill C-27", count: 3 },
};

export const MOCK_COMPARE: ScopeCompareResponse = {
    generated_at: NOW,
    time_window: WINDOW,
    total: 1326,
    canada: 86,
    global: 1240,
    other: 0,
    categories: [
        { name: "policy", canada: 20, global: 300 },
        { name: "research", canada: 15, global: 450 },
    ]
};

export const MOCK_CONFIDENCE: ConfidenceProfileResponse = {
    generated_at: NOW,
    time_window: WINDOW,
    total: 86,
    average_confidence: 0.85,
    buckets: [
        { name: "very_high", count: 15, percent: 17 },
        { name: "high", count: 45, percent: 52 },
        { name: "medium", count: 20, percent: 23 },
        { name: "low", count: 6, percent: 7 },
    ],
};

export const MOCK_CONCENTRATION: ConcentrationResponse = {
    generated_at: NOW,
    time_window: WINDOW,
    total: 154,
    source_hhi: 1200,
    source_level: "medium",
    jurisdiction_hhi: 1800,
    jurisdiction_level: "high",
    category_hhi: 1500,
    category_level: "medium",
    combined_hhi: 1400,
    combined_level: "medium",
    top_sources: [{ name: "Google News", count: 45 }],
    top_jurisdictions: [{ name: "Federal", count: 45 }],
};

export const MOCK_MOMENTUM: MomentumResponse = {
    generated_at: NOW,
    time_window: "24h",
    categories: [
        { name: "policy", current: 45, previous: 10, change: 35, delta_percent: 350 },
        { name: "industry", current: 30, previous: 25, change: 5, delta_percent: 20 },
    ],
    publishers: [
        { name: "CBC", current: 20, previous: 5, change: 15, delta_percent: 300 },
    ]
};

export const MOCK_RISK_INDEX: RiskIndexResponse = {
    generated_at: NOW,
    time_window: "24h",
    score: 3.5,
    level: "low",
    total: 100,
    incidents: 0,
    low_confidence: 5,
    high_alert_count: 2,
    incidents_ratio: 0,
    low_confidence_ratio: 0.05,
    combined_hhi: 1200,
    reasons: ["policy_uncertainty"],
};

export const MOCK_ENTITY_MOMENTUM: EntityMomentumResponse = {
    generated_at: NOW,
    time_window: "24h",
    entities: [
        { name: "Cohere", current: 50, previous: 20, change: 30, delta_percent: 150 },
        { name: "Microsoft", current: 40, previous: 45, change: -5, delta_percent: -11 },
    ],
};

const riskHours = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now);
    d.setHours(d.getHours() - (2 - i) * 8);
    return d.toISOString();
});

export const MOCK_RISK_TREND: RiskTrendResponse = {
    generated_at: NOW,
    time_window: "24h",
    xAxis: riskHours,
    risk_score: [2.1, 2.4, 3.5],
    incidents_ratio_pct: [0, 0, 0],
    low_confidence_ratio_pct: [5, 4, 6],
};

export const MOCK_SUMMARY: SummaryResponse = {
    generated_at: NOW,
    time_window: "24h",
    bullets: [
        "Canada's AI ecosystem is currently focused on infrastructure scaling and regulatory alignment.",
        "Major funding announcements dominate the news cycle.",
        "Research output remains steady with new papers from Mila."
    ],
};

export const MOCK_COVERAGE: CoverageResponse = {
    generated_at: NOW,
    time_window: WINDOW,
    total: 100,
    categories: [
        { name: "policy", count: 45, percent: 45 },
        { name: "research", count: 30, percent: 30 },
    ],
    source_types: [
        { name: "News", count: 60, percent: 60 },
        { name: "Official", count: 25, percent: 25 },
    ],
    languages: [
        { name: "English", count: 80, percent: 80 },
        { name: "French", count: 20, percent: 20 },
    ],
    jurisdictions: [
        { name: "Federal", count: 40, percent: 40 },
        { name: "Provincial", count: 60, percent: 60 },
    ],
};
