import { CHATGPT_MOMENT_ISO, IntelItem, IntelType, MONITORED_ENTITIES } from './types';

interface FeedSource {
  name: string;
  url: string;
  type: IntelType;
  category: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(entry: string, tag: string): string {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeHtmlEntities(match[1]) : '';
}

function extractAtomLink(entry: string): string {
  const hrefMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?>(?:<\/link>)?/i);
  return hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : '';
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CanadaAIPulse/1.0',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function findEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const entities = [
    ...MONITORED_ENTITIES.nationalInstitutions,
    ...MONITORED_ENTITIES.companies,
    ...MONITORED_ENTITIES.provinces,
  ];

  return entities.filter((entity) => lower.includes(entity.toLowerCase()));
}

function calculateRelevance(text: string, entities: string[]): number {
  const lower = text.toLowerCase();
  let score = 1.8;

  if (lower.includes('canada') || lower.includes('canadian')) score += 1;
  if (lower.includes('artificial intelligence') || lower.includes('generative ai')) score += 0.9;
  if (lower.includes('policy') || lower.includes('regulation') || lower.includes('governance')) score += 0.5;
  if (lower.includes('funding') || lower.includes('investment')) score += 0.5;

  score += Math.min(entities.length * 0.35, 1.2);
  return Math.min(Math.round(score * 10) / 10, 5);
}

function isCanadaAiRelevant(text: string): boolean {
  const lower = text.toLowerCase();

  const canadaSignals = [
    'canada',
    'canadian',
    'toronto',
    'montreal',
    'vancouver',
    'ottawa',
    'quebec',
    'ontario',
    'alberta',
    'mila',
    'vector institute',
    'amii',
    'cifar',
  ];

  const aiSignals = [
    'artificial intelligence',
    'generative ai',
    'ai model',
    'ai strategy',
    'large language model',
    'machine learning',
    'deep learning',
    'foundation model',
    'llm',
  ];

  return canadaSignals.some((term) => lower.includes(term)) && aiSignals.some((term) => lower.includes(term));
}

function deduplicateByUrl(items: IntelItem[]): IntelItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function deduplicateByTitle(items: IntelItem[]): IntelItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function normalizeTitle(rawTitle: string): { title: string; sourceHint: string } {
  const title = decodeHtmlEntities(rawTitle);
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    const sourceHint = parts[parts.length - 1];
    return {
      title: parts.slice(0, -1).join(' - ').trim(),
      sourceHint: sourceHint.trim(),
    };
  }

  return { title, sourceHint: '' };
}

async function scanGoogleNewsFeed(params: {
  query: string;
  type: IntelType;
  category: string;
}): Promise<IntelItem[]> {
  const { query, type, category } = params;
  const items: IntelItem[] = [];

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-CA&gl=CA&ceid=CA:en`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return items;

    const xml = await response.text();
    const entries = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    entries.slice(0, 30).forEach((entry) => {
      const rawTitle = extractTag(entry, 'title');
      const description = extractTag(entry, 'description');
      const link = extractTag(entry, 'link');
      const publishedAt = extractTag(entry, 'pubDate');
      const source = extractTag(entry, 'source');

      const { title, sourceHint } = normalizeTitle(rawTitle);
      const combined = `${title} ${description}`;

      if (!title || !link) return;
      if (!isCanadaAiRelevant(combined)) return;

      const entities = findEntities(combined);

      items.push({
        id: generateId(),
        type,
        title,
        description: description || 'No summary available.',
        url: link,
        source: source || sourceHint || 'Google News',
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        relevanceScore: calculateRelevance(combined, entities),
        entities: entities.length > 0 ? entities : ['Canada AI'],
        category,
        region: 'Canada',
      });
    });
  } catch (error) {
    console.error(`Google News scan failed for query: ${query}`, error);
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

async function scanCuratedFeeds(): Promise<IntelItem[]> {
  const feeds: FeedSource[] = [
    {
      name: 'CBC Technology',
      url: 'https://www.cbc.ca/webfeed/rss/rss-technology',
      type: 'news',
      category: 'Canadian Media',
    },
    {
      name: 'BetaKit',
      url: 'https://betakit.com/feed/',
      type: 'funding',
      category: 'Startup and Funding',
    },
    {
      name: 'Mila News',
      url: 'https://mila.quebec/en/feed/',
      type: 'research',
      category: 'Research Institute',
    },
    {
      name: 'Amii News',
      url: 'https://www.amii.ca/latest-news/feed/',
      type: 'research',
      category: 'Research Institute',
    },
    {
      name: 'Vector Institute Insights',
      url: 'https://vectorinstitute.ai/feed/',
      type: 'research',
      category: 'Research Institute',
    },
  ];

  const allItems: IntelItem[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const response = await fetchWithTimeout(feed.url);
        if (!response.ok) return;

        const xml = await response.text();
        const rssEntries = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        const atomEntries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        const entries = rssEntries.length > 0 ? rssEntries : atomEntries;

        entries.slice(0, 30).forEach((entry) => {
          const title = extractTag(entry, 'title');
          const description = extractTag(entry, 'description') || extractTag(entry, 'summary');
          const link = extractTag(entry, 'link') || extractAtomLink(entry);
          const publishedAt =
            extractTag(entry, 'pubDate') || extractTag(entry, 'updated') || extractTag(entry, 'published');

          const combined = `${title} ${description}`;

          if (!title || !link) return;
          if (!isCanadaAiRelevant(combined)) return;

          const entities = findEntities(combined);

          allItems.push({
            id: generateId(),
            type: feed.type,
            title,
            description: description || 'No summary available.',
            url: link,
            source: feed.name,
            publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            relevanceScore: calculateRelevance(combined, entities),
            entities: entities.length > 0 ? entities : ['Canada AI'],
            category: feed.category,
            region: 'Canada',
          });
        });
      } catch (error) {
        console.error(`Curated feed scan failed: ${feed.name}`, error);
      }
    }),
  );

  return deduplicateByTitle(deduplicateByUrl(allItems));
}

export async function scanNews(): Promise<IntelItem[]> {
  const queries = [
    'artificial intelligence Canada',
    'generative AI Canada',
    'Canadian AI startup',
    'AI adoption Canada business',
    'AI health care Canada',
    'site:cbc.ca AI Canada',
    'site:theglobeandmail.com AI Canada',
    'site:nationalpost.com AI Canada',
  ];

  const queryResults = await Promise.all(
    queries.map((query) => scanGoogleNewsFeed({ query, type: 'news', category: 'News and Analysis' })),
  );

  const feedResults = await scanCuratedFeeds();

  return deduplicateByTitle(deduplicateByUrl([...queryResults.flat(), ...feedResults.filter((item) => item.type === 'news')]));
}

export async function scanPolicy(): Promise<IntelItem[]> {
  const queries = [
    'Government of Canada AI policy',
    'Canada AI regulation',
    'Treasury Board AI Canada',
    'ISED generative AI Canada',
    'site:canada.ca artificial intelligence policy',
    'site:ontario.ca artificial intelligence',
    'site:quebec.ca intelligence artificielle',
    'site:alberta.ca artificial intelligence',
    'site:bc.ca artificial intelligence',
  ];

  const results = await Promise.all(
    queries.map((query) => scanGoogleNewsFeed({ query, type: 'policy', category: 'Policy and Governance' })),
  );

  return deduplicateByTitle(deduplicateByUrl(results.flat()));
}

export async function scanFunding(): Promise<IntelItem[]> {
  const queries = [
    'Canada AI funding round',
    'Canadian AI investment',
    'venture capital AI Canada',
    'federal funding AI Canada',
    'site:betakit.com AI funding',
    'site:thelogic.co AI funding Canada',
    'Scale AI supercluster funding',
  ];

  const queryResults = await Promise.all(
    queries.map((query) => scanGoogleNewsFeed({ query, type: 'funding', category: 'Capital and Funding' })),
  );

  const feedResults = await scanCuratedFeeds();

  return deduplicateByTitle(
    deduplicateByUrl([...queryResults.flat(), ...feedResults.filter((item) => item.type === 'funding')]),
  );
}

export async function scanResearch(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  const queries = [
    'all:"artificial intelligence" AND (all:"Canada" OR all:"Canadian")',
    'all:"generative" AND all:"Canada"',
    'all:"machine learning" AND (all:"Mila" OR all:"Vector Institute" OR all:"Amii")',
    'all:"CIFAR" AND all:"artificial intelligence"',
  ];

  for (const query of queries) {
    try {
      const response = await fetchWithTimeout(
        `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`,
      );

      if (!response.ok) continue;

      const xml = await response.text();
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      entries.forEach((entry) => {
        const title = extractTag(entry, 'title');
        const summary = extractTag(entry, 'summary');
        const url = extractTag(entry, 'id');
        const publishedAt = extractTag(entry, 'published');

        const combined = `${title} ${summary}`;
        if (!title || !url) return;
        if (!isCanadaAiRelevant(combined)) return;

        const entities = findEntities(combined);

        items.push({
          id: generateId(),
          type: 'research',
          title,
          description: summary.slice(0, 500),
          url,
          source: 'arXiv',
          publishedAt: publishedAt || new Date().toISOString(),
          discoveredAt: new Date().toISOString(),
          relevanceScore: calculateRelevance(combined, entities),
          entities: entities.length > 0 ? entities : ['Canada AI Research'],
          category: 'Academic Research',
          region: 'Canada',
        });
      });
    } catch (error) {
      console.error(`arXiv scan failed for query: ${query}`, error);
    }
  }

  const feedResults = await scanCuratedFeeds();

  return deduplicateByTitle(
    deduplicateByUrl([...items, ...feedResults.filter((item) => item.type === 'research')]),
  );
}

export async function scanGitHub(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  const token = process.env.GITHUB_TOKEN;

  const queries = [
    'Canada artificial intelligence',
    'Canadian generative AI startup',
    'Mila deep learning',
    'Vector Institute machine learning',
    'Amii machine learning',
    'Cohere LLM',
  ];

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CanadaAIPulse',
  };

  if (token) headers.Authorization = `token ${token}`;

  for (const query of queries) {
    try {
      const response = await fetchWithTimeout(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`,
        15000,
      );

      if (!response.ok) continue;

      const data = await response.json();
      const repos = data.items || [];

      repos.forEach((repo: Record<string, unknown>) => {
        const name = String(repo.full_name || '');
        const description = String(repo.description || 'No description provided.');
        const topics = Array.isArray(repo.topics) ? repo.topics.join(' ') : '';
        const combined = `${name} ${description} ${topics}`;

        if (!isCanadaAiRelevant(combined)) return;

        const entities = findEntities(combined);

        items.push({
          id: generateId(),
          type: 'github',
          title: name,
          description,
          url: String(repo.html_url || ''),
          source: 'GitHub',
          publishedAt: String(repo.updated_at || new Date().toISOString()),
          discoveredAt: new Date().toISOString(),
          relevanceScore: calculateRelevance(combined, entities),
          entities: entities.length > 0 ? entities : ['Canada OSS'],
          category: `${String(repo.language || 'Unknown')} | ${String(repo.stargazers_count || 0)} stars`,
          region: 'Canada',
        });
      });
    } catch (error) {
      console.error(`GitHub scan failed for query: ${query}`, error);
    }
  }

  return deduplicateByTitle(deduplicateByUrl(items.filter((item) => item.url)));
}

function historicalSeedData(): IntelItem[] {
  const baseline = [
    {
      date: CHATGPT_MOMENT_ISO,
      type: 'news' as IntelType,
      title: 'ChatGPT moment starts the current AI cycle',
      description:
        'Historical baseline marker for the start of the modern generative AI wave. This seeded marker anchors long-range Canada AI trend charts.',
      url: 'https://en.wikipedia.org/wiki/ChatGPT',
      category: 'Historical Baseline',
    },
    {
      date: '2023-06-01T00:00:00.000Z',
      type: 'policy' as IntelType,
      title: 'Canadian institutions accelerate AI governance planning',
      description:
        'Seeded baseline marker to represent increased federal and institutional governance activity in 2023.',
      url: 'https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai.html',
      category: 'Historical Baseline',
    },
    {
      date: '2023-10-01T00:00:00.000Z',
      type: 'research' as IntelType,
      title: 'Canada AI labs increase output on foundation-model research',
      description:
        'Seeded baseline marker for growing publication momentum across major Canadian AI institutes.',
      url: 'https://mila.quebec/en/',
      category: 'Historical Baseline',
    },
    {
      date: '2024-04-01T00:00:00.000Z',
      type: 'funding' as IntelType,
      title: 'Compute and commercialization become core AI funding themes in Canada',
      description:
        'Seeded baseline marker for the shift from experimentation to scaled deployment and compute investment.',
      url: 'https://ised-isde.canada.ca/site/ised/en',
      category: 'Historical Baseline',
    },
    {
      date: '2025-01-01T00:00:00.000Z',
      type: 'news' as IntelType,
      title: 'Enterprise AI adoption expands across Canadian sectors',
      description:
        'Seeded baseline marker for broad cross-industry AI integration in operations, products, and services.',
      url: 'https://www150.statcan.gc.ca/',
      category: 'Historical Baseline',
    },
  ];

  return baseline.map((entry) => ({
    id: `historical-${entry.type}-${entry.date}`,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    url: entry.url,
    source: 'AI Canada Pulse Baseline',
    publishedAt: entry.date,
    discoveredAt: new Date().toISOString(),
    relevanceScore: 4,
    entities: ['Canada AI'],
    category: entry.category,
    region: 'Canada',
  }));
}

export async function runFullScan(): Promise<{
  news: IntelItem[];
  research: IntelItem[];
  policy: IntelItem[];
  github: IntelItem[];
  funding: IntelItem[];
  errors: string[];
}> {
  const errors: string[] = [];

  let news: IntelItem[] = [];
  let research: IntelItem[] = [];
  let policy: IntelItem[] = [];
  let github: IntelItem[] = [];
  let funding: IntelItem[] = [];

  try {
    news = await scanNews();
  } catch (error) {
    errors.push(`News scan failed: ${String(error)}`);
  }

  try {
    research = await scanResearch();
  } catch (error) {
    errors.push(`Research scan failed: ${String(error)}`);
  }

  try {
    policy = await scanPolicy();
  } catch (error) {
    errors.push(`Policy scan failed: ${String(error)}`);
  }

  try {
    github = await scanGitHub();
  } catch (error) {
    errors.push(`GitHub scan failed: ${String(error)}`);
  }

  try {
    funding = await scanFunding();
  } catch (error) {
    errors.push(`Funding scan failed: ${String(error)}`);
  }

  const baseline = historicalSeedData();
  news = deduplicateByTitle(deduplicateByUrl([...news, ...baseline.filter((item) => item.type === 'news')]));
  policy = deduplicateByTitle(deduplicateByUrl([...policy, ...baseline.filter((item) => item.type === 'policy')]));
  research = deduplicateByTitle(deduplicateByUrl([...research, ...baseline.filter((item) => item.type === 'research')]));
  funding = deduplicateByTitle(deduplicateByUrl([...funding, ...baseline.filter((item) => item.type === 'funding')]));

  return { news, research, policy, github, funding, errors };
}
