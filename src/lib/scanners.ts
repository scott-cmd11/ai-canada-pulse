import { IntelItem, MONITORED_ENTITIES } from './types';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Keywords that indicate relevance to grain quality/grading with ML/AI
const REQUIRED_KEYWORDS = [
  'grain', 'wheat', 'corn', 'rice', 'barley', 'soybean', 'maize', 'cereal',
  'seed', 'kernel', 'crop'
];

const ML_KEYWORDS = [
  'machine learning', 'deep learning', 'neural network', 'cnn', 'computer vision',
  'image classification', 'object detection', 'artificial intelligence', 'ai',
  'classification', 'detection', 'recognition', 'analysis', 'inspection',
  'grading', 'sorting', 'quality', 'assessment', 'evaluation'
];

// Check if content is relevant to grain quality + ML/AI
function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Must mention a grain/seed type
  const hasGrainKeyword = REQUIRED_KEYWORDS.some(kw => lowerText.includes(kw));

  // Must mention ML/AI or quality assessment
  const hasMLKeyword = ML_KEYWORDS.some(kw => lowerText.includes(kw));

  return hasGrainKeyword && hasMLKeyword;
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

// Calculate relevance score based on content
function calculateRelevance(text: string, entities: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 2; // Base score for relevant content

  // More entities = higher relevance
  score += Math.min(entities.length * 0.5, 2);

  // Check for high-value keywords
  const highValueKeywords = ['grading', 'sorting', 'quality assessment', 'inspection', 'classification accuracy'];
  highValueKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 0.3;
  });

  // Bonus for specific grain types
  const grainTypes = ['wheat', 'rice', 'corn', 'maize', 'barley', 'soybean'];
  grainTypes.forEach(grain => {
    if (lowerText.includes(grain)) score += 0.2;
  });

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

// Deduplicate by similar titles (fuzzy match)
function deduplicateByTitle(items: IntelItem[]): IntelItem[] {
  const result: IntelItem[] = [];
  const seenTitles: string[] = [];

  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if we've seen a similar title (80% match)
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

  // More specific search queries
  const searchQueries = [
    '"grain quality" AND ("machine learning" OR "AI" OR "computer vision")',
    '"grain grading" AND "artificial intelligence"',
    '"wheat quality" AND "deep learning"',
    '"seed sorting" AND "automation"',
    '"grain inspection" AND "technology"',
    ...MONITORED_ENTITIES.companies.established.slice(0, 3).map(c => `"${c}" grain quality`)
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

          // Skip if not relevant
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

// Scan arXiv for research papers - more targeted queries
export async function scanResearch(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // Highly specific queries for grain quality ML/AI research
  const searchQueries = [
    'ti:"grain quality" AND (cat:cs.CV OR cat:cs.LG)',
    'ti:"wheat" AND ti:"classification" AND (cat:cs.CV OR cat:cs.LG)',
    'ti:"grain" AND ti:"grading" AND abs:"deep learning"',
    'ti:"seed" AND ti:"quality" AND abs:"neural network"',
    'ti:"rice" AND ti:"classification" AND abs:"machine learning"',
    'ti:"corn" AND ti:"kernel" AND abs:"computer vision"',
    'abs:"grain sorting" AND abs:"machine learning"',
    'abs:"cereal grain" AND abs:"image classification"'
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

          // Additional relevance check
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

// Scan GitHub for repositories - more targeted
export async function scanGitHub(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const token = process.env.GITHUB_TOKEN;

  // More specific queries
  const searchQueries = [
    'grain quality classification machine learning',
    'wheat grading deep learning',
    'grain sorting computer vision',
    'seed quality assessment CNN',
    'rice grain classification neural network',
    'corn kernel detection'
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
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=5`,
        { headers }
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.items) {
        for (const repo of data.items) {
          const fullText = `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`;

          // Check relevance
          if (!isRelevant(fullText)) continue;

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
  // Patent scanning placeholder - would need USPTO or Google Patents API
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
