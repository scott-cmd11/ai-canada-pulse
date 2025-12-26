// Intelligence data types

export type IntelType = 'news' | 'research' | 'patent' | 'github' | 'funding';

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
  entities: string[]; // Companies/products mentioned
  category: string;
  imageUrl?: string;
}

export interface ScanResult {
  success: boolean;
  itemsFound: number;
  newItems: number;
  timestamp: string;
  sources: string[];
  errors?: string[];
}

export interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  byType: Record<IntelType, number>;
  topEntities: { name: string; count: number }[];
  lastScan: string;
}

// Companies and products to monitor
export const MONITORED_ENTITIES = {
  companies: {
    established: [
      'Cgrain', 'Cropify', 'Deimos', 'EasyODM', 'FOSS', 'Ground Truth Ag',
      'Platypus Vision', 'Nebulaa', 'QualySense', 'Upjao', 'Vibe Imaging Analytics',
      'Videometer', 'Zeutec', 'ZoomAgri'
    ],
    emerging: [
      'GoMicro', 'Inarix', 'Grain Discovery', 'SuperGeo AI Tech', 'Agsure',
      'GrainSense', 'Grainkart', 'Hongsheng Technology', 'Keyetech'
    ]
  },
  products: [
    'Value Pro', 'Value Sorter', 'Opal grain', 'EyeFoss', 'Platypus grain analyzer',
    'MATT Automatic Grain Analyser', 'QSorter Explorer', 'Upjao Easy', 'Upjao Ultra',
    'QM3i Analyzers', 'SeedLab', 'SeedSorter', 'SpectraAlyzer GRAIN VISION AI',
    'ZoomVARIETIES', 'ZoomSPEX'
  ],
  topics: [
    'grain quality assessment', 'grain analyzer AI', 'seed quality machine learning',
    'grain sorting automation', 'agricultural computer vision', 'grain inspection system',
    'wheat quality detection', 'corn kernel analysis', 'grain grading technology'
  ]
};
