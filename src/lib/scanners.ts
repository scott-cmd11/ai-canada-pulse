import { CHATGPT_MOMENT_ISO, IntelItem, IntelType, MONITORED_ENTITIES, REGION_KEYWORDS, SOURCE_REGISTRY, SourceDefinition } from './types';

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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function inferRegionTag(text: string, url?: string): NonNullable<IntelItem['regionTag']> {
  const lower = `${text} ${url || ''}`.toLowerCase();

  for (const entry of REGION_KEYWORDS) {
    if (entry.keywords.some((keyword) => lower.includes(keyword.toLowerCase()))) {
      return {
        country: 'Canada',
        province: entry.province,
        city: entry.city,
        hub: entry.hub,
      };
    }
  }

  return {
    country: 'Canada',
    province: 'National',
    hub: 'Pan-Canadian',
  };
}

function findEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const entities = [
    ...MONITORED_ENTITIES.nationalInstitutions,
    ...MONITORED_ENTITIES.companies,
    ...MONITORED_ENTITIES.provinces,
    ...MONITORED_ENTITIES.cities,
  ];

  return entities.filter((entity) => {
    const normalized = entity.toLowerCase();
    if (normalized.length <= 4) {
      const strict = new RegExp(`\\b${escapeRegex(normalized)}\\b`, 'i');
      return strict.test(text);
    }
    return lower.includes(normalized);
  });
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

function buildItem(params: {
  sourceDef: SourceDefinition;
  title: string;
  description: string;
  link: string;
  publishedAt?: string;
  sourceNameOverride?: string;
}): IntelItem {
  const combined = `${params.title} ${params.description}`;
  const entities = findEntities(combined);
  const regionTag = inferRegionTag(combined, params.link);

  return {
    id: generateId(),
    type: params.sourceDef.type,
    title: params.title,
    description: params.description || 'No summary available.',
    url: params.link,
    source: params.sourceNameOverride || params.sourceDef.name,
    sourceId: params.sourceDef.id,
    publishedAt: params.publishedAt ? new Date(params.publishedAt).toISOString() : new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    relevanceScore: calculateRelevance(combined, entities),
    entities: entities.length > 0 ? entities : ['Canada AI'],
    category: params.sourceDef.category,
    region: regionTag.province,
    regionTag,
    provenance: {
      sourceReliability: params.sourceDef.reliability,
      sourceKind: params.sourceDef.kind,
      cadenceMinutes: params.sourceDef.cadenceMinutes,
      ingestedAt: new Date().toISOString(),
      regionConfidence: regionTag.city ? 'high' : regionTag.province !== 'National' ? 'medium' : 'low',
    },
  };
}

async function scanGoogleNewsSource(sourceDef: SourceDefinition): Promise<IntelItem[]> {
  if (!sourceDef.query) return [];
  const items: IntelItem[] = [];

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(sourceDef.query)}&hl=en-CA&gl=CA&ceid=CA:en`;

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

      items.push(
        buildItem({
          sourceDef,
          title,
          description,
          link,
          publishedAt,
          sourceNameOverride: source || sourceHint || sourceDef.name,
        }),
      );
    });
  } catch (error) {
    console.error(`Google News scan failed for source: ${sourceDef.name}`, error);
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

async function scanRssSource(sourceDef: SourceDefinition): Promise<IntelItem[]> {
  if (!sourceDef.url) return [];

  try {
    const response = await fetchWithTimeout(sourceDef.url);
    if (!response.ok) return [];

    const xml = await response.text();
    const rssEntries = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const atomEntries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    const entries = rssEntries.length > 0 ? rssEntries : atomEntries;

    const items: IntelItem[] = [];
    entries.slice(0, 30).forEach((entry) => {
      const title = extractTag(entry, 'title');
      const description = extractTag(entry, 'description') || extractTag(entry, 'summary');
      const link = extractTag(entry, 'link') || extractAtomLink(entry);
      const publishedAt =
        extractTag(entry, 'pubDate') || extractTag(entry, 'updated') || extractTag(entry, 'published');

      const combined = `${title} ${description}`;

      if (!title || !link) return;
      if (!isCanadaAiRelevant(combined)) return;

      items.push(buildItem({ sourceDef, title, description, link, publishedAt }));
    });

    return deduplicateByTitle(deduplicateByUrl(items));
  } catch (error) {
    console.error(`RSS scan failed for source: ${sourceDef.name}`, error);
    return [];
  }
}

async function scanArxivSources(sourceDefs: SourceDefinition[]): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  for (const sourceDef of sourceDefs) {
    if (!sourceDef.query) continue;

    try {
      const response = await fetchWithTimeout(
        `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(sourceDef.query)}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`,
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

        items.push(buildItem({ sourceDef, title, description: summary.slice(0, 500), link: url, publishedAt }));
      });
    } catch (error) {
      console.error(`arXiv scan failed for source: ${sourceDef.name}`, error);
    }
  }

  return deduplicateByTitle(deduplicateByUrl(items));
}

async function scanGithubSources(sourceDefs: SourceDefinition[]): Promise<IntelItem[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CanadaAIPulse',
  };
  if (token) headers.Authorization = `token ${token}`;

  const fallbackQueries = [
    'Canadian generative AI startup',
    'Mila deep learning',
    'Vector Institute machine learning',
    'Amii machine learning',
    'Cohere LLM',
  ];

  const seededQueries = sourceDefs.map((entry) => entry.query).filter(Boolean) as string[];
  const queries = Array.from(new Set([...seededQueries, ...fallbackQueries]));

  const items: IntelItem[] = [];

  for (const query of queries) {
    try {
      const response = await fetchWithTimeout(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`,
        15000,
      );

      if (!response.ok) continue;

      const data = await response.json();
      const repos = data.items || [];
      const sourceDef = sourceDefs[0] || SOURCE_REGISTRY.find((entry) => entry.kind === 'github-api');
      if (!sourceDef) continue;

      repos.forEach((repo: Record<string, unknown>) => {
        const name = String(repo.full_name || '');
        const description = String(repo.description || 'No description provided.');
        const topics = Array.isArray(repo.topics) ? repo.topics.join(' ') : '';
        const combined = `${name} ${description} ${topics}`;

        if (!isCanadaAiRelevant(combined)) return;

        items.push(
          buildItem({
            sourceDef,
            title: name,
            description,
            link: String(repo.html_url || ''),
            publishedAt: String(repo.updated_at || new Date().toISOString()),
          }),
        );
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

  const baselineSource = SOURCE_REGISTRY.find((entry) => entry.kind === 'baseline');

  return baseline.map((entry) => {
    const regionTag = inferRegionTag(`${entry.title} ${entry.description}`, entry.url);
    return {
      id: `historical-${entry.type}-${entry.date}`,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      url: entry.url,
      source: baselineSource?.name || 'AI Canada Pulse Baseline',
      sourceId: baselineSource?.id,
      publishedAt: entry.date,
      discoveredAt: new Date().toISOString(),
      relevanceScore: 4,
      entities: ['Canada AI'],
      category: entry.category,
      region: regionTag.province,
      regionTag,
      provenance: {
        sourceReliability: baselineSource?.reliability || 80,
        sourceKind: 'baseline',
        cadenceMinutes: baselineSource?.cadenceMinutes || 1440,
        ingestedAt: new Date().toISOString(),
        regionConfidence: regionTag.city ? 'high' : regionTag.province !== 'National' ? 'medium' : 'low',
      },
    };
  });
}

export async function scanNews(): Promise<IntelItem[]> {
  const defs = SOURCE_REGISTRY.filter((entry) => entry.type === 'news' && (entry.kind === 'google-news' || entry.kind === 'rss'));
  const googleDefs = defs.filter((entry) => entry.kind === 'google-news');
  const rssDefs = defs.filter((entry) => entry.kind === 'rss');

  const queryResults = await Promise.all(googleDefs.map((sourceDef) => scanGoogleNewsSource(sourceDef)));
  const feedResults = await Promise.all(rssDefs.map((sourceDef) => scanRssSource(sourceDef)));

  return deduplicateByTitle(deduplicateByUrl([...queryResults.flat(), ...feedResults.flat()]));
}

export async function scanPolicy(): Promise<IntelItem[]> {
  const defs = SOURCE_REGISTRY.filter((entry) => entry.type === 'policy' && entry.kind === 'google-news');
  const results = await Promise.all(defs.map((sourceDef) => scanGoogleNewsSource(sourceDef)));
  return deduplicateByTitle(deduplicateByUrl(results.flat()));
}

export async function scanFunding(): Promise<IntelItem[]> {
  const defs = SOURCE_REGISTRY.filter((entry) => entry.type === 'funding' && (entry.kind === 'google-news' || entry.kind === 'rss'));
  const queryResults = await Promise.all(
    defs.filter((entry) => entry.kind === 'google-news').map((sourceDef) => scanGoogleNewsSource(sourceDef)),
  );
  const feedResults = await Promise.all(
    defs.filter((entry) => entry.kind === 'rss').map((sourceDef) => scanRssSource(sourceDef)),
  );

  return deduplicateByTitle(deduplicateByUrl([...queryResults.flat(), ...feedResults.flat()]));
}

export async function scanResearch(): Promise<IntelItem[]> {
  const arxivDefs = SOURCE_REGISTRY.filter((entry) => entry.type === 'research' && entry.kind === 'arxiv');
  const rssDefs = SOURCE_REGISTRY.filter((entry) => entry.type === 'research' && entry.kind === 'rss');

  const arxivItems = await scanArxivSources(arxivDefs);
  const rssItems = await Promise.all(rssDefs.map((sourceDef) => scanRssSource(sourceDef)));

  return deduplicateByTitle(deduplicateByUrl([...arxivItems, ...rssItems.flat()]));
}

export async function scanGitHub(): Promise<IntelItem[]> {
  const defs = SOURCE_REGISTRY.filter((entry) => entry.type === 'github' && entry.kind === 'github-api');
  return scanGithubSources(defs);
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
