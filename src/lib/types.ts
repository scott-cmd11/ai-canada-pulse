export type IntelType = 'news' | 'research' | 'policy' | 'github' | 'funding';
export type TrendDirection = 'up' | 'down' | 'flat';

export type SourceKind = 'rss' | 'google-news' | 'arxiv' | 'github-api' | 'baseline';

export interface RegionTag {
  country: 'Canada';
  province: string;
  city?: string;
  hub?: string;
}

export interface IntelItem {
  id: string;
  type: IntelType;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceId?: string;
  publishedAt: string;
  discoveredAt: string;
  relevanceScore: number;
  entities: string[];
  category: string;
  region?: string;
  regionTag?: RegionTag;
  provenance?: IntelProvenance;
  imageUrl?: string;
}

export interface IntelProvenance {
  sourceReliability: number;
  sourceKind: SourceKind;
  cadenceMinutes: number;
  ingestedAt: string;
  regionConfidence: 'high' | 'medium' | 'low';
}

export interface SourceDefinition {
  id: string;
  name: string;
  kind: SourceKind;
  type: IntelType;
  category: string;
  url?: string;
  query?: string;
  cadenceMinutes: number;
  reliability: number;
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
  keywordVector: string[];
  regionFocus: string[];
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

export interface RegionalBreakdown {
  region: string;
  count: number;
}

export interface RegulatorySnapshot {
  score: number;
  level: 'low' | 'medium' | 'high';
  mentions24h: number;
  mentions7d: number;
  timeline: TimelinePoint[];
  threshold: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface Nudge {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  actionLabel: string;
  actionTarget: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'source' | 'region';
  weight: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CollaborationNote {
  id: string;
  targetType: 'entity' | 'cluster';
  targetId: string;
  text: string;
  createdAt: string;
}

export interface AssistantResponse {
  reply: string;
  filters?: {
    watchlist?: string;
    type?: IntelType;
    region?: string;
    source?: string;
    query?: string;
  };
  suggestion?: string;
}

export interface EntitySummary {
  name: string;
  count: number;
  avgRelevance: number;
  topSources: { name: string; count: number }[];
  recentItems: IntelItem[];
  latestAt: string | null;
  byType: Record<IntelType, number>;
  regions: RegionalBreakdown[];
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
  regionalBreakdown: RegionalBreakdown[];
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
  sourceRegistry: SourceDefinition[];
  eventClusters: EventCluster[];
  momentum: MomentumItem[];
  regulatory: RegulatorySnapshot;
  nudges: Nudge[];
  relationshipGraph: RelationshipGraph;
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
    terms: ['regulation', 'policy', 'government', 'treasury board', 'ised', 'governance', 'bill', 'law', 'aida', 'c-27'],
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
  cities: ['Toronto', 'Montreal', 'Vancouver', 'Edmonton', 'Calgary', 'Ottawa', 'Waterloo'],
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

export const REGULATORY_TERMS = [
  'bill c-27',
  'aida',
  'artificial intelligence and data act',
  'algorithmic impact assessment',
  'treasury board',
  'ised',
  'regulation',
  'governance',
  'policy',
  'compliance',
];

export const SOURCE_REGISTRY: SourceDefinition[] = [
  { id: 'google-news-core', name: 'Google News Core Canada AI', kind: 'google-news', type: 'news', category: 'News and Analysis', query: 'artificial intelligence Canada', cadenceMinutes: 60, reliability: 67 },
  { id: 'google-news-genai', name: 'Google News GenAI Canada', kind: 'google-news', type: 'news', category: 'News and Analysis', query: 'generative AI Canada', cadenceMinutes: 60, reliability: 67 },
  { id: 'google-news-startups', name: 'Google News Canadian AI Startups', kind: 'google-news', type: 'news', category: 'News and Analysis', query: 'Canadian AI startup', cadenceMinutes: 60, reliability: 67 },
  { id: 'google-news-policy', name: 'Google News Canada AI Policy', kind: 'google-news', type: 'policy', category: 'Policy and Governance', query: 'Government of Canada AI policy', cadenceMinutes: 90, reliability: 74 },
  { id: 'google-news-aida', name: 'Google News Bill C-27 AIDA', kind: 'google-news', type: 'policy', category: 'Policy and Governance', query: 'Bill C-27 AIDA Canada', cadenceMinutes: 90, reliability: 74 },
  { id: 'google-news-funding', name: 'Google News Canada AI Funding', kind: 'google-news', type: 'funding', category: 'Capital and Funding', query: 'Canada AI funding round', cadenceMinutes: 90, reliability: 70 },
  { id: 'cbc-tech-rss', name: 'CBC Technology', kind: 'rss', type: 'news', category: 'Canadian Media', url: 'https://www.cbc.ca/webfeed/rss/rss-technology', cadenceMinutes: 60, reliability: 84 },
  { id: 'betakit-rss', name: 'BetaKit', kind: 'rss', type: 'funding', category: 'Startup and Funding', url: 'https://betakit.com/feed/', cadenceMinutes: 60, reliability: 76 },
  { id: 'mila-rss', name: 'Mila News', kind: 'rss', type: 'research', category: 'Research Institute', url: 'https://mila.quebec/en/feed/', cadenceMinutes: 120, reliability: 90 },
  { id: 'amii-rss', name: 'Amii News', kind: 'rss', type: 'research', category: 'Research Institute', url: 'https://www.amii.ca/latest-news/feed/', cadenceMinutes: 120, reliability: 89 },
  { id: 'vector-rss', name: 'Vector Institute Insights', kind: 'rss', type: 'research', category: 'Research Institute', url: 'https://vectorinstitute.ai/feed/', cadenceMinutes: 120, reliability: 89 },
  { id: 'arxiv-canada-ai', name: 'arXiv Canada AI', kind: 'arxiv', type: 'research', category: 'Academic Research', query: 'all:"artificial intelligence" AND (all:"Canada" OR all:"Canadian")', cadenceMinutes: 180, reliability: 81 },
  { id: 'github-canada-ai', name: 'GitHub Canada AI', kind: 'github-api', type: 'github', category: 'Open Source', query: 'Canada artificial intelligence', cadenceMinutes: 120, reliability: 70 },
  { id: 'baseline-chatgpt', name: 'Historical Baseline Signals', kind: 'baseline', type: 'news', category: 'Historical Baseline', cadenceMinutes: 1440, reliability: 80 },
];

export const REGION_KEYWORDS: Array<{ region: string; province: string; city?: string; hub?: string; keywords: string[] }> = [
  { region: 'Ontario', province: 'Ontario', city: 'Toronto', hub: 'Toronto-Waterloo', keywords: ['ontario', 'toronto', 'waterloo', 'vector institute'] },
  { region: 'Quebec', province: 'Quebec', city: 'Montreal', hub: 'Montreal', keywords: ['quebec', 'montreal', 'mila', 'intelligence artificielle'] },
  { region: 'British Columbia', province: 'British Columbia', city: 'Vancouver', hub: 'Vancouver', keywords: ['british columbia', 'vancouver', 'bc ai'] },
  { region: 'Alberta', province: 'Alberta', city: 'Edmonton', hub: 'Edmonton-Calgary', keywords: ['alberta', 'edmonton', 'calgary', 'amii'] },
  { region: 'Federal', province: 'Federal', city: 'Ottawa', hub: 'Ottawa', keywords: ['ottawa', 'parliament', 'canada.ca', 'treasury board', 'ised'] },
];
