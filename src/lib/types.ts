export type IntelType = 'news' | 'research' | 'policy' | 'github' | 'funding';

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
