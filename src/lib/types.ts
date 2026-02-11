export type IntelType = 'news' | 'research' | 'policy' | 'github' | 'funding';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface IntelItem {
  id: string;
  type: IntelType;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  discoveredAt: string;
  relevanceScore: number;
  entities: string[];
  category: string;
  region?: string;
  imageUrl?: string;
}

export interface TimelinePoint {
  label: string;
  count: number;
}

export interface SourceReliability {
  name: string;
  score: number;
  tier: 'high' | 'medium' | 'low';
  count: number;
}

export interface EventCluster {
  id: string;
  headline: string;
  topUrl: string;
  itemCount: number;
  sources: string[];
  entities: string[];
  types: IntelType[];
  latestAt: string;
  score: number;
}

export interface MomentumItem {
  name: string;
  current: number;
  previous: number;
  deltaPercent: number;
  direction: TrendDirection;
}

export interface Briefing {
  window: 'daily' | 'weekly' | 'monthly';
  headline: string;
  summary: string;
  bullets: string[];
  generatedAt: string;
}

export interface WatchlistDefinition {
  id: string;
  name: string;
  description: string;
  terms: string[];
}

export interface WatchlistSnapshot {
  id: string;
  name: string;
  description: string;
  count: number;
  deltaPercent: number;
  direction: TrendDirection;
  topItems: IntelItem[];
}

export interface ActivityHeatmapCell {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  itemsThisMonth: number;
  itemsThisYear: number;
  byType: Record<IntelType, number>;
  bySource: { name: string; count: number }[];
  topEntities: { name: string; count: number }[];
  timeline: {
    daily: TimelinePoint[];
    weekly: TimelinePoint[];
    monthly: TimelinePoint[];
    yearly: TimelinePoint[];
  };
  quality: {
    avgRelevance: number;
    avgReliability: number;
    sourceDiversity: number;
  };
  signalMix: {
    high: number;
    medium: number;
    low: number;
  };
  sourceReliability: SourceReliability[];
  eventClusters: EventCluster[];
  momentum: MomentumItem[];
  briefings: {
    daily: Briefing;
    weekly: Briefing;
    monthly: Briefing;
  };
  watchlists: WatchlistSnapshot[];
  heatmap: ActivityHeatmapCell[];
  lastScan: string;
}

export interface ScanResult {
  success: boolean;
  itemsFound: number;
  newItems: number;
  timestamp: string;
  sources: string[];
  errors?: string[];
}

export const CHATGPT_MOMENT_ISO = '2022-11-30T00:00:00.000Z';

export const WATCHLISTS: WatchlistDefinition[] = [
  {
    id: 'foundation-models',
    name: 'Foundation Models',
    description: 'LLM releases, model capabilities, and compute scaling in Canada.',
    terms: ['llm', 'foundation model', 'model release', 'cohere', 'openai', 'gpt', 'claude', 'gemini'],
  },
  {
    id: 'public-policy',
    name: 'Public Policy',
    description: 'Federal/provincial rules, governance, and AI regulation activity.',
    terms: ['regulation', 'policy', 'government', 'treasury board', 'ised', 'governance', 'bill', 'law'],
  },
  {
    id: 'startup-capital',
    name: 'Startup Capital',
    description: 'Funding rounds, accelerators, and commercialization signals.',
    terms: ['funding', 'investment', 'venture', 'seed round', 'series a', 'series b', 'capital', 'scale ai'],
  },
  {
    id: 'healthcare-ai',
    name: 'Healthcare AI',
    description: 'AI in diagnostics, hospital systems, and public health applications.',
    terms: ['healthcare', 'hospital', 'clinical', 'diagnostic', 'medtech', 'health system', 'patient'],
  },
];

export const MONITORED_ENTITIES = {
  nationalInstitutions: [
    'Vector Institute',
    'Mila',
    'Amii',
    'CIFAR',
    'NRC',
    'Treasury Board of Canada Secretariat',
    'ISED',
    'Scale AI',
  ],
  companies: [
    'Cohere',
    'Waabi',
    'Hopper',
    'Tenstorrent',
    'Ada',
    'ApplyBoard',
    'Shopify',
    'Google Canada',
    'Microsoft Canada',
    'OpenAI',
  ],
  provinces: [
    'Ontario',
    'Quebec',
    'British Columbia',
    'Alberta',
    'Nova Scotia',
    'Manitoba',
    'Saskatchewan',
  ],
  topics: [
    'artificial intelligence Canada',
    'generative AI Canada',
    'AI policy Canada',
    'Canadian AI startup funding',
    'AI regulation Canada',
    'AI research Canada',
    'public sector AI Canada',
  ],
};

