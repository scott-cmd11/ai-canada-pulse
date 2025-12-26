import { IntelItem, MONITORED_ENTITIES } from './types';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Official grain types from Canadian Grain Grading Guide
const GRAIN_TYPES = [
  // Cereals
  'wheat', 'rye', 'barley', 'oats', 'triticale', 'mixed grain', 'buckwheat', 'corn', 'maize',
  // Oilseeds
  'canola', 'rapeseed', 'flaxseed', 'mustard seed', 'domestic mustard', 'sunflower seed', 'sunflower', 'safflower seed', 'safflower', 'canary seed',
  // Pulses
  'peas', 'lentils', 'beans', 'soybeans', 'soybean', 'faba beans', 'faba bean', 'chickpeas', 'chickpea',
  // Generic terms
  'grain', 'kernel', 'seed', 'cereal', 'pulse', 'oilseed'
];

// Official grading factors from Canadian Grain Commission
const GRADING_FACTORS = [
  // Primary grading factors
  'test weight', 'moisture', 'moisture content', 'dockage', 'foreign material',
  'damaged kernels', 'falling number', 'protein', 'protein content',

  // Defects and damage types
  'fusarium', 'fusarium damage', 'fusarium head blight', 'fhb', 'scab',
  'frost damage', 'frost damaged', 'sprouted', 'sprouting',
  'heated', 'binburnt', 'fireburnt', 'heat damage',
  'insect damage', 'insect damaged', 'mildew', 'mildewed',
  'ergot', 'blackpoint', 'black point',
  'weather stain', 'weathering', 'weathered',
  'green kernels', 'immature',
  'don', 'deoxynivalenol', 'vomitoxin', 'mycotoxin',

  // Quality measurements
  'hard vitreous kernels', 'hvk', 'vitreous',
  'alpha-amylase', 'amylase activity',
  'thousand kernel weight', 'tkw',
  'bulk density', 'hectolitre weight',

  // Grading terms
  'grade', 'grading', 'grain grade', 'quality assessment',
  'sample grade', 'feed grade',
  'defect', 'defects', 'tolerance', 'tolerances'
];

// ML/AI terms for technology relevance
const ML_TERMS = [
  'machine learning', 'deep learning', 'neural network', 'cnn', 'convolutional',
  'computer vision', 'image processing', 'image classification', 'image analysis',
  'object detection', 'classification', 'classifier', 'segmentation',
  'artificial intelligence', 'ai', 'ml',
  'yolo', 'resnet', 'vgg', 'mobilenet', 'efficientnet',
  'tensorflow', 'pytorch', 'keras', 'opencv',
  'hyperspectral', 'multispectral', 'nir', 'near-infrared', 'spectroscopy',
  'x-ray', 'imaging', 'vision system', 'automated', 'automation'
];

// Check if content is relevant to grain grading + ML/AI
function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Must mention a grain type
  const hasGrainType = GRAIN_TYPES.some(grain => lowerText.includes(grain));
  if (!hasGrainType) return false;

  // Must mention a grading factor OR an ML term
  const hasGradingFactor = GRADING_FACTORS.some(factor => lowerText.includes(factor));
  const hasMLTerm = ML_TERMS.some(term => lowerText.includes(term));

  return hasGradingFactor || hasMLTerm;
}

// Stricter relevance for GitHub - must have grain + grading + ML
function isGitHubRelevant(text: string, repoName: string): boolean {
  const lowerText = (text + ' ' + repoName).toLowerCase();

  const hasGrainType = GRAIN_TYPES.some(grain => lowerText.includes(grain));
  if (!hasGrainType) return false;

  const hasGradingFactor = GRADING_FACTORS.some(factor => lowerText.includes(factor));
  const hasMLTerm = ML_TERMS.some(term => lowerText.includes(term));

  // Must have both grading relevance AND ML/AI
  return hasGradingFactor && hasMLTerm;
}

// Find which monitored entities are mentioned in text
function findEntities(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  [...MONITORED_ENTITIES.companies.established, ...MONITORED_ENTITIES.companies.emerging]
    .forEach(company => {
      if (lowerText.includes(company.toLowerCase())) {
        found.push(company);
      }
    });

  MONITORED_ENTITIES.products.forEach(product => {
    if (lowerText.includes(product.toLowerCase())) {
      found.push(product);
    }
  });

  return found;
}

// Calculate relevance score based on grading factors mentioned
function calculateRelevance(text: string, entities: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 2;

  // Bonus for monitored entities
  score += Math.min(entities.length * 0.5, 1.5);

  // Bonus for specific grading factors
  const criticalFactors = ['fusarium', 'test weight', 'moisture', 'protein', 'falling number', 'grading'];
  criticalFactors.forEach(factor => {
    if (lowerText.includes(factor)) score += 0.3;
  });

  // Bonus for ML terms
  const mlBonus = ['deep learning', 'cnn', 'neural network', 'computer vision'].some(t => lowerText.includes(t));
  if (mlBonus) score += 0.5;

  return Math.min(Math.round(score * 10) / 10, 5);
}

// Deduplicate items by URL
function deduplicateByUrl(items: IntelItem[]): IntelItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

// Deduplicate by similar titles
function deduplicateByTitle(items: IntelItem[]): IntelItem[] {
  const result: IntelItem[] = [];
  const seenTitles: string[] = [];

  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isDuplicate = seenTitles.some(seen => {
      if (normalizedTitle.length < 20) return normalizedTitle === seen;
      const shorter = normalizedTitle.length < seen.length ? normalizedTitle : seen;
      const longer = normalizedTitle.length >= seen.length ? normalizedTitle : seen;
      return longer.includes(shorter) || shorter.includes(longer.slice(0, shorter.length));
    });

    if (!isDuplicate) {
      result.push(item);
      seenTitles.push(normalizedTitle);
    }
  }

  return result;
}

// Scan GNews API for news articles
export async function scanNews(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.log('GNews API key not configured');
    return items;
  }

  // Queries focused on grain grading and quality assessment
  const searchQueries = [
    '"grain grading" AND ("machine learning" OR "AI" OR "automation")',
    '"wheat quality" AND ("fusarium" OR "test weight" OR "protein")',
    '"grain quality assessment" AND "technology"',
    '"kernel damage" OR "grain defect" AND "detection"',
    '"grain inspection" AND ("computer vision" OR "imaging")',
    ...MONITORED_ENTITIES.companies.established.slice(0, 3).map(c => `"${c}" grain grading`)
  ];

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${apiKey}`
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.articles) {
        for (const article of data.articles) {
          const fullText = `${article.title} ${article.description || ''}`;

          if (!isRelevant(fullText)) continue;

          const entities = findEntities(fullText);

          items.push({
            id: generateId(),
            type: 'news',
            title: article.title,
            description: article.description || '',
            url: article.url,
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt,
            discoveredAt: new Date().toISOString(),
            relevanceScore: calculateRelevance(fullText, entities),
            entities: entities.length > 0 ? entities : ['Industry'],
            category: 'Industry News',
            imageUrl: article.image
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error scanning news for "${query}":`, error);
    }
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

// Scan arXiv for research papers on grain grading
export async function scanResearch(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // Queries focused on grain grading factors and ML
  const searchQueries = [
    'ti:"wheat" AND abs:"grading" AND abs:"deep learning"',
    'ti:"grain" AND abs:"quality" AND abs:"classification"',
    'ti:"kernel" AND abs:"defect" AND abs:"detection"',
    'abs:"fusarium" AND abs:"wheat" AND abs:"detection"',
    'abs:"grain" AND abs:"moisture" AND abs:"prediction"',
    'ti:"rice" AND abs:"grading" AND abs:"neural network"',
    'abs:"grain" AND abs:"test weight" AND abs:"machine learning"',
    'abs:"wheat" AND abs:"protein" AND abs:"prediction"',
    'ti:"corn" AND abs:"kernel" AND abs:"classification"',
    'abs:"grain sorting" AND abs:"computer vision"'
  ];

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`
      );

      if (!response.ok) continue;

      const text = await response.text();
      const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

      for (const entry of entries) {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
        const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
        const link = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || '';
        const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || '';

        if (title && link) {
          const fullText = `${title} ${summary}`;

          if (!isRelevant(fullText)) continue;

          const entities = findEntities(fullText);

          items.push({
            id: generateId(),
            type: 'research',
            title: title.replace(/\n/g, ' ').trim(),
            description: summary.replace(/\n/g, ' ').slice(0, 500).trim(),
            url: link,
            source: 'arXiv',
            publishedAt: published,
            discoveredAt: new Date().toISOString(),
            relevanceScore: calculateRelevance(fullText, entities),
            entities: entities.length > 0 ? entities : ['Research'],
            category: 'Academic Research'
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error scanning arXiv for "${query}":`, error);
    }
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

// Scan GitHub for grain grading ML projects
export async function scanGitHub(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const token = process.env.GITHUB_TOKEN;

  // Very specific queries for grain grading ML projects
  const searchQueries = [
    'wheat grain grading classification CNN',
    'grain quality defect detection deep learning',
    'kernel damage classification neural network',
    'fusarium wheat detection machine learning',
    'grain moisture prediction',
    'rice grading classification pytorch',
    'corn kernel defect detection',
    'wheat protein prediction machine learning',
    'grain test weight prediction'
  ];

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GrainIntelMonitor'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
        { headers }
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.items) {
        for (const repo of data.items) {
          const fullText = `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`;

          if (!isGitHubRelevant(fullText, repo.name)) continue;

          const entities = findEntities(fullText);

          items.push({
            id: generateId(),
            type: 'github',
            title: repo.full_name,
            description: repo.description || 'No description',
            url: repo.html_url,
            source: 'GitHub',
            publishedAt: repo.updated_at,
            discoveredAt: new Date().toISOString(),
            relevanceScore: calculateRelevance(fullText, entities),
            entities: entities.length > 0 ? entities : ['Open Source'],
            category: `${repo.stargazers_count} stars | ${repo.language || 'Unknown'}`
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error scanning GitHub for "${query}":`, error);
    }
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

// Scan for patents
export async function scanPatents(): Promise<IntelItem[]> {
  return [];
}

// Main scan function
export async function runFullScan(): Promise<{
  news: IntelItem[];
  research: IntelItem[];
  github: IntelItem[];
  patents: IntelItem[];
  errors: string[];
}> {
  const errors: string[] = [];

  let news: IntelItem[] = [];
  let research: IntelItem[] = [];
  let github: IntelItem[] = [];
  let patents: IntelItem[] = [];

  try {
    news = await scanNews();
  } catch (e) {
    errors.push(`News scan failed: ${e}`);
  }

  try {
    research = await scanResearch();
  } catch (e) {
    errors.push(`Research scan failed: ${e}`);
  }

  try {
    github = await scanGitHub();
  } catch (e) {
    errors.push(`GitHub scan failed: ${e}`);
  }

  try {
    patents = await scanPatents();
  } catch (e) {
    errors.push(`Patent scan failed: ${e}`);
  }

  return { news, research, github, patents, errors };
}
