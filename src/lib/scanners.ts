import { IntelItem, MONITORED_ENTITIES } from './types';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  let score = 1;

  // More entities = higher relevance
  score += Math.min(entities.length * 0.5, 2);

  // Check for high-value keywords
  const highValueKeywords = ['funding', 'acquisition', 'partnership', 'launch', 'patent', 'breakthrough'];
  highValueKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) score += 0.5;
  });

  return Math.min(Math.round(score * 10) / 10, 5);
}

// Scan GNews API for news articles
export async function scanNews(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.log('GNews API key not configured');
    return items;
  }

  const searchQueries = [
    'grain quality assessment technology',
    'grain analyzer AI machine learning',
    'agricultural computer vision grain',
    'seed quality automation',
    ...MONITORED_ENTITIES.companies.established.slice(0, 5).map(c => `"${c}" grain`)
  ];

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${apiKey}`
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.articles) {
        for (const article of data.articles) {
          const fullText = `${article.title} ${article.description || ''}`;
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
            entities: entities.length > 0 ? entities : ['General'],
            category: 'Industry News',
            imageUrl: article.image
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error scanning news for "${query}":`, error);
    }
  }

  return items;
}

// Scan arXiv for research papers
export async function scanResearch(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  const searchQueries = [
    'grain quality assessment',
    'seed classification deep learning',
    'wheat quality computer vision',
    'grain sorting machine learning',
    'agricultural image analysis grain'
  ];

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`
      );

      if (!response.ok) continue;

      const text = await response.text();

      // Parse XML response
      const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

      for (const entry of entries) {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
        const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
        const link = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || '';
        const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || '';

        if (title && link) {
          const fullText = `${title} ${summary}`;
          const entities = findEntities(fullText);

          items.push({
            id: generateId(),
            type: 'research',
            title: title.replace(/\n/g, ' '),
            description: summary.replace(/\n/g, ' ').slice(0, 500),
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

  return items;
}

// Scan GitHub for repositories and code
export async function scanGitHub(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const token = process.env.GITHUB_TOKEN;

  const searchQueries = [
    'grain quality assessment',
    'grain analyzer',
    'seed classification',
    'wheat quality detection',
    'grain grading machine learning'
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
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=10`,
        { headers }
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.items) {
        for (const repo of data.items) {
          const fullText = `${repo.name} ${repo.description || ''}`;
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

  return items;
}

// Scan for patents (using Google Patents RSS-like approach)
export async function scanPatents(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // For patents, we'll use a simplified approach with web search
  // In production, you might want to use USPTO API or Google Patents API
  const patentQueries = [
    'grain quality assessment patent',
    'grain analyzer patent',
    'seed sorting system patent'
  ];

  // This is a placeholder - in production you'd integrate with a patent API
  console.log('Patent scanning: Would search for', patentQueries);

  return items;
}

// Main scan function that runs all scanners
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
