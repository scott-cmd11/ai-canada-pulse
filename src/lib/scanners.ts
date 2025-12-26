import { IntelItem, MONITORED_ENTITIES } from './types';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Official grain types from Canadian Grain Grading Guide - SPECIFIC crop names only
const GRAIN_CROPS = [
  'wheat', 'rye', 'barley', 'oats', 'triticale', 'buckwheat', 'corn', 'maize',
  'canola', 'rapeseed', 'flaxseed', 'mustard seed', 'sunflower seed', 'safflower seed', 'canary seed',
  'peas', 'lentils', 'beans', 'soybeans', 'soybean', 'faba beans', 'chickpeas',
  'rice', 'sorghum', 'millet'
];

// Phrases that indicate actual grain/crop context (not ML jargon)
const GRAIN_CONTEXT_PHRASES = [
  'grain quality', 'grain grading', 'grain classification', 'grain sorting', 'grain inspection',
  'wheat quality', 'wheat grading', 'wheat kernel', 'wheat grain',
  'rice quality', 'rice grading', 'rice grain',
  'corn kernel', 'corn quality', 'maize kernel', 'maize quality',
  'barley quality', 'barley grading', 'malting barley',
  'oat quality', 'oats grading',
  'soybean quality', 'soybean grading',
  'lentil quality', 'lentil grading', 'lentil sorting',
  'canola quality', 'canola grading',
  'seed quality', 'seed grading', 'seed classification', 'seed sorting',
  'crop quality', 'crop grading',
  'cereal grain', 'cereal quality',
  'pulse quality', 'pulse grading',
  'oilseed quality', 'oilseed grading',
  'kernel damage', 'damaged kernel', 'broken kernel',
  'test weight', 'hectolitre weight', 'bulk density',
  'moisture content', 'grain moisture',
  'foreign material', 'dockage',
  'fusarium', 'mycotoxin', 'don level', 'deoxynivalenol', 'vomitoxin',
  'sprouted grain', 'sprouting damage', 'falling number',
  'frost damage', 'heat damage', 'weather damage',
  'protein content', 'grain protein',
  'hard vitreous', 'vitreous kernel',
  'milling quality', 'baking quality', 'malting quality',
  'grain defect', 'seed defect',
  'grain analyzer', 'grain analyser', 'grain inspection system'
];

// Terms to EXCLUDE - ML jargon that creates false positives
const EXCLUDE_TERMS = [
  'fine-grained', 'coarse-grained', 'multi-grained',
  'kernel method', 'kernel function', 'gaussian kernel', 'rbf kernel',
  'kernel trick', 'kernel matrix', 'kernel density',
  'attention kernel', 'convolution kernel',
  'linux kernel', 'operating system kernel',
  'exoplanet', 'astronomy', 'astrophysics',
  'fabric defect', 'textile', 'tableware',
  'timber', 'wood moisture', 'lumber',
  'sand grain', 'aeolian', 'sediment'
];

// Check if content is STRICTLY relevant to grain grading
function isStrictlyRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();

  // First, EXCLUDE papers with ML jargon or unrelated topics
  for (const exclude of EXCLUDE_TERMS) {
    if (lowerText.includes(exclude)) return false;
  }

  // Must contain a grain context phrase (specific to agricultural grain)
  const hasGrainContext = GRAIN_CONTEXT_PHRASES.some(phrase => lowerText.includes(phrase));

  // OR must contain a specific crop name + quality/grading related term
  const hasCropName = GRAIN_CROPS.some(crop => {
    const cropPattern = new RegExp(`\\b${crop}\\b`, 'i');
    return cropPattern.test(text);
  });

  const hasQualityTerm = [
    'quality', 'grading', 'grade', 'sorting', 'classification', 'detection',
    'defect', 'damage', 'inspection', 'assessment', 'evaluation', 'analysis'
  ].some(term => lowerText.includes(term));

  const hasMLTerm = [
    'machine learning', 'deep learning', 'neural network', 'cnn', 'computer vision',
    'image processing', 'classification model', 'detection model', 'yolo', 'resnet',
    'tensorflow', 'pytorch', 'automated', 'automation'
  ].some(term => lowerText.includes(term));

  // Accept if: has grain context phrase, OR (has crop name AND quality term AND ML term)
  return hasGrainContext || (hasCropName && hasQualityTerm && hasMLTerm);
}

// Find which monitored entities are mentioned
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

// Calculate relevance score
function calculateRelevance(text: string, entities: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 2;

  score += Math.min(entities.length * 0.5, 1.5);

  const criticalFactors = ['fusarium', 'test weight', 'moisture content', 'protein content', 'falling number', 'grain grading', 'grain quality'];
  criticalFactors.forEach(factor => {
    if (lowerText.includes(factor)) score += 0.3;
  });

  const mlBonus = ['deep learning', 'cnn', 'neural network', 'computer vision', 'yolo'].some(t => lowerText.includes(t));
  if (mlBonus) score += 0.5;

  return Math.min(Math.round(score * 10) / 10, 5);
}

// Deduplicate by URL
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

// Scan GNews API for news
export async function scanNews(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.log('GNews API key not configured');
    return items;
  }

  const searchQueries = [
    '"grain grading" technology',
    '"wheat quality" assessment',
    '"grain inspection" automation',
    '"fusarium" wheat detection',
    '"grain sorting" machine',
    ...MONITORED_ENTITIES.companies.established.slice(0, 3).map(c => `"${c}" grain`)
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

          if (!isStrictlyRelevant(fullText)) continue;

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

// Scan arXiv - VERY specific queries only
export async function scanResearch(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // Highly specific queries that should only return grain-related papers
  const searchQueries = [
    'ti:"wheat" AND ti:"quality" AND abs:"deep learning"',
    'ti:"grain" AND ti:"grading" AND abs:"classification"',
    'ti:"rice" AND ti:"quality" AND abs:"machine learning"',
    'ti:"wheat" AND ti:"kernel" AND abs:"detection"',
    'ti:"corn" AND ti:"kernel" AND abs:"classification"',
    'ti:"soybean" AND ti:"quality" AND abs:"classification"',
    'ti:"lentil" AND abs:"sorting" AND abs:"machine"',
    'ti:"barley" AND ti:"quality" AND abs:"neural"',
    'abs:"grain sorting" AND abs:"computer vision"',
    'abs:"fusarium" AND abs:"wheat" AND abs:"detection"',
    'abs:"seed quality" AND abs:"deep learning"',
    'ti:"cereal" AND abs:"grading" AND abs:"image"'
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

          // Apply strict relevance filter
          if (!isStrictlyRelevant(fullText)) continue;

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

// Scan GitHub - strict grain grading focus
export async function scanGitHub(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const token = process.env.GITHUB_TOKEN;

  const searchQueries = [
    'wheat grain quality classification',
    'rice grain grading deep learning',
    'grain defect detection CNN',
    'wheat kernel classification',
    'soybean quality machine learning',
    'corn kernel defect detection',
    'lentil sorting classification',
    'seed quality assessment neural network'
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

          if (!isStrictlyRelevant(fullText)) continue;

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
