/**
 * Adapter: bridges legacy IntelItem data → new dashboard FeedItem + analytics shapes.
 */
import type { IntelItem } from './legacy-types';
import type {
    FeedItem,
    FeedResponse,
    KPIWindow,
    KPIsResponse,
    EChartsResponse,
    SourcesBreakdownResponse,
    JurisdictionsBreakdownResponse,
    EntitiesBreakdownResponse,
    TagsBreakdownResponse,
    StatsAlertItem,
    StatsAlertsResponse,
    StatsBriefResponse,
    ScopeCompareResponse,
    ConfidenceProfileResponse,
    ConcentrationResponse,
    MomentumResponse,
    RiskIndexResponse,
    EntityMomentumResponse,
    RiskTrendResponse,
    SummaryResponse,
    CoverageResponse,
    TimeWindow,
    Category,
} from './types';

// ─── Helpers ──────────────────────────────────────────────

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

function mapCategory(item: IntelItem): Category {
    const typeMap: Record<string, Category> = {
        news: 'news',
        research: 'research',
        policy: 'policy',
        funding: 'funding',
        github: 'industry',
    };
    return typeMap[item.type] || 'news';
}

function getItemDate(item: IntelItem): Date {
    const parsed = new Date(item.publishedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return new Date(item.discoveredAt);
}

function windowToMs(tw: TimeWindow): number {
    const map: Record<TimeWindow, number> = {
        '1h': 3600_000,
        '24h': 86400_000,
        '7d': 604800_000,
        '15d': 1296000_000,
        '30d': 2592000_000,
        '90d': 7776000_000,
        '1y': 31536000_000,
        '2y': 63072000_000,
        '5y': 157680000_000,
    };
    return map[tw] || 1296000_000;
}

function filterByWindow(items: IntelItem[], tw: TimeWindow): IntelItem[] {
    const cutoff = Date.now() - windowToMs(tw);
    return items.filter((i) => getItemDate(i).getTime() >= cutoff);
}

// ─── IntelItem → FeedItem ─────────────────────────────────

export function toFeedItem(item: IntelItem): FeedItem {
    return {
        id: item.id,
        source_id: item.sourceId || item.source,
        source_type: item.type,
        category: mapCategory(item),
        title: item.title,
        url: item.url,
        publisher: item.source,
        published_at: item.publishedAt,
        ingested_at: item.discoveredAt || item.publishedAt,
        language: 'en',
        jurisdiction: item.regionTag?.province || item.region || 'Canada',
        entities: item.entities || [],
        tags: [item.type, item.category || ''].filter(Boolean),
        hash: simpleHash(item.url),
        confidence: Math.min(1, (item.relevanceScore || 2.5) / 5),
    };
}

// ─── Feed with pagination / filtering ─────────────────────

export function buildFeedResponse(
    items: IntelItem[],
    opts: { page?: number; page_size?: number; time_window?: TimeWindow; category?: string; jurisdiction?: string; search?: string },
): FeedResponse {
    let filtered = opts.time_window ? filterByWindow(items, opts.time_window) : items;

    if (opts.category) {
        filtered = filtered.filter((i) => mapCategory(i) === opts.category);
    }
    if (opts.jurisdiction) {
        const j = opts.jurisdiction.toLowerCase();
        filtered = filtered.filter((i) => {
            const region = (i.regionTag?.province || i.region || 'Canada').toLowerCase();
            return region.includes(j);
        });
    }
    if (opts.search) {
        const q = opts.search.toLowerCase();
        filtered = filtered.filter(
            (i) =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                i.entities.some((e) => e.toLowerCase().includes(q)),
        );
    }

    const page = opts.page || 1;
    const pageSize = opts.page_size || 50;
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    return {
        items: slice.map(toFeedItem),
        page,
        page_size: pageSize,
        total: filtered.length,
    };
}

// ─── KPIs ─────────────────────────────────────────────────

function buildKPIWindow(items: IntelItem[], windowMs: number): KPIWindow {
    const now = Date.now();
    const current = items.filter((i) => now - getItemDate(i).getTime() < windowMs).length;
    const previous = items.filter((i) => {
        const t = now - getItemDate(i).getTime();
        return t >= windowMs && t < windowMs * 2;
    }).length;
    const delta_percent = previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(1));
    return { current, previous, delta_percent };
}

export function buildKPIs(items: IntelItem[]): KPIsResponse {
    return {
        m15: buildKPIWindow(items, 15 * 60_000),
        h1: buildKPIWindow(items, 3600_000),
        d7: buildKPIWindow(items, 604800_000),
    };
}

// ─── ECharts series ───────────────────────────────────────

function buildEChartsSeries(items: IntelItem[], bucketCount: number, bucketMs: number): EChartsResponse {
    const now = Date.now();
    const categories: Category[] = ['policy', 'research', 'industry', 'funding', 'news', 'incidents'];
    const xAxis: string[] = [];
    const dataMap: Record<Category, number[]> = {} as Record<Category, number[]>;
    categories.forEach((c) => (dataMap[c] = []));

    for (let i = bucketCount - 1; i >= 0; i--) {
        const bucketStart = now - (i + 1) * bucketMs;
        const bucketEnd = now - i * bucketMs;
        const label = new Date(bucketEnd).toISOString().slice(0, 13) + ':00';
        xAxis.push(label);

        const bucketItems = items.filter((item) => {
            const t = getItemDate(item).getTime();
            return t >= bucketStart && t < bucketEnd;
        });

        categories.forEach((cat) => {
            dataMap[cat].push(bucketItems.filter((item) => mapCategory(item) === cat).length);
        });
    }

    const legend = categories.filter((c) => dataMap[c].some((v) => v > 0));
    const series = legend.map((name) => ({
        name,
        type: 'line',
        stack: 'total',
        areaStyle: {},
        emphasis: { focus: 'series' as const },
        data: dataMap[name],
    }));

    return { legend, xAxis, series };
}

export function buildHourlySeries(items: IntelItem[]): EChartsResponse {
    return buildEChartsSeries(items, 24, 3600_000);
}

export function buildWeeklySeries(items: IntelItem[]): EChartsResponse {
    return buildEChartsSeries(items, 12, 604800_000);
}

// ─── Breakdowns ───────────────────────────────────────────

function countField(items: IntelItem[], getter: (i: IntelItem) => string[]): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    items.forEach((i) => getter(i).forEach((v) => { counts[v] = (counts[v] || 0) + 1; }));
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

export function buildSourcesBreakdown(items: IntelItem[], tw: TimeWindow): SourcesBreakdownResponse {
    const filtered = filterByWindow(items, tw);
    return {
        time_window: tw,
        total: filtered.length,
        publishers: countField(filtered, (i) => [i.source]).slice(0, 20),
        source_types: countField(filtered, (i) => [i.type]).slice(0, 10),
    };
}

export function buildJurisdictionsBreakdown(items: IntelItem[], tw: TimeWindow): JurisdictionsBreakdownResponse {
    const filtered = filterByWindow(items, tw);
    return {
        time_window: tw,
        total: filtered.length,
        jurisdictions: countField(filtered, (i) => [i.regionTag?.province || i.region || 'Canada']).slice(0, 20),
    };
}

export function buildEntitiesBreakdown(items: IntelItem[], tw: TimeWindow): EntitiesBreakdownResponse {
    const filtered = filterByWindow(items, tw);
    return {
        time_window: tw,
        total: filtered.length,
        entities: countField(filtered, (i) => i.entities).slice(0, 30),
    };
}

export function buildTagsBreakdown(items: IntelItem[], tw: TimeWindow): TagsBreakdownResponse {
    const filtered = filterByWindow(items, tw);
    return {
        time_window: tw,
        total: filtered.length,
        tags: countField(filtered, (i) => [i.type, i.category || ''].filter(Boolean)).slice(0, 20),
    };
}

// ─── Alerts ───────────────────────────────────────────────

export function buildAlerts(items: IntelItem[], tw: TimeWindow): StatsAlertsResponse {
    const windowMs = windowToMs(tw);
    const now = Date.now();
    const categories: Category[] = ['policy', 'research', 'industry', 'funding', 'news', 'incidents'];
    const alerts: StatsAlertItem[] = [];

    categories.forEach((cat) => {
        const current = items.filter((i) => mapCategory(i) === cat && now - getItemDate(i).getTime() < windowMs).length;
        const previous = items.filter((i) => {
            const t = now - getItemDate(i).getTime();
            return mapCategory(i) === cat && t >= windowMs && t < windowMs * 2;
        }).length;

        if (previous === 0 && current === 0) return;
        const delta_percent = previous === 0 ? 100 : Number((((current - previous) / previous) * 100).toFixed(1));
        if (Math.abs(delta_percent) < 20) return;

        alerts.push({
            category: cat,
            direction: current >= previous ? 'up' : 'down',
            severity: Math.abs(delta_percent) >= 50 ? 'high' : 'medium',
            current,
            previous,
            delta_percent,
        });
    });

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        min_baseline: 5,
        min_delta_percent: 20,
        min_z_score: 1.5,
        lookback_windows: 4,
        alerts,
    };
}

// ─── Brief ────────────────────────────────────────────────

export function buildBrief(items: IntelItem[], tw: TimeWindow): StatsBriefResponse {
    const filtered = filterByWindow(items, tw);
    const categories = countField(filtered, (i) => [mapCategory(i)]);
    const jurisdictions = countField(filtered, (i) => [i.regionTag?.province || i.region || 'Canada']);
    const publishers = countField(filtered, (i) => [i.source]);
    const tags = countField(filtered, (i) => i.entities);

    const alertCount = buildAlerts(items, tw).alerts.filter((a) => a.severity === 'high').length;

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        total_items: filtered.length,
        high_alert_count: alertCount,
        top_category: categories[0] || { name: 'none', count: 0 },
        top_jurisdiction: jurisdictions[0] || { name: 'none', count: 0 },
        top_publisher: publishers[0] || { name: 'none', count: 0 },
        top_tag: tags[0] || { name: 'none', count: 0 },
    };
}

// ─── Scope compare ────────────────────────────────────────

export function buildScopeCompare(items: IntelItem[], tw: TimeWindow): ScopeCompareResponse {
    const filtered = filterByWindow(items, tw);
    const canada = filtered.filter((i) => {
        const j = (i.regionTag?.province || i.region || '').toLowerCase();
        return j !== 'national' && j !== '' && j !== 'Canada'.toLowerCase();
    }).length;
    const total = filtered.length;

    const categories: Category[] = ['policy', 'research', 'industry', 'funding', 'news', 'incidents'];

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        total,
        canada,
        global: total - canada,
        other: 0,
        categories: categories.map((name) => ({
            name,
            canada: filtered.filter((i) => mapCategory(i) === name && (i.regionTag?.province || '').toLowerCase() !== 'national').length,
            global: filtered.filter((i) => mapCategory(i) === name && (i.regionTag?.province || '').toLowerCase() === 'national').length,
        })),
    };
}

// ─── Confidence profile ──────────────────────────────────

export function buildConfidenceProfile(items: IntelItem[], tw: TimeWindow): ConfidenceProfileResponse {
    const filtered = filterByWindow(items, tw);
    const total = filtered.length || 1;

    const buckets = [
        { name: 'very_high' as const, min: 0.8, count: 0 },
        { name: 'high' as const, min: 0.6, count: 0 },
        { name: 'medium' as const, min: 0.4, count: 0 },
        { name: 'low' as const, min: 0, count: 0 },
    ];

    filtered.forEach((i) => {
        const conf = Math.min(1, (i.relevanceScore || 2.5) / 5);
        const bucket = buckets.find((b) => conf >= b.min);
        if (bucket) bucket.count++;
    });

    const avgConf = filtered.reduce((s, i) => s + Math.min(1, (i.relevanceScore || 2.5) / 5), 0) / total;

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        total: filtered.length,
        average_confidence: Number(avgConf.toFixed(3)),
        buckets: buckets.map((b) => ({ name: b.name, count: b.count, percent: Number(((b.count / total) * 100).toFixed(1)) })),
    };
}

// ─── Concentration (HHI) ─────────────────────────────────

function computeHHI(counts: { name: string; count: number }[], total: number): number {
    if (total === 0) return 0;
    return Math.round(counts.reduce((sum, c) => sum + ((c.count / total) * 100) ** 2, 0));
}

function hhiLevel(hhi: number): 'low' | 'medium' | 'high' {
    if (hhi >= 2500) return 'high';
    if (hhi >= 1500) return 'medium';
    return 'low';
}

export function buildConcentration(items: IntelItem[], tw: TimeWindow): ConcentrationResponse {
    const filtered = filterByWindow(items, tw);
    const total = filtered.length;

    const sources = countField(filtered, (i) => [i.source]);
    const jurisdictions = countField(filtered, (i) => [i.regionTag?.province || i.region || 'Canada']);
    const categories = countField(filtered, (i) => [mapCategory(i)]);

    const sourceHHI = computeHHI(sources, total);
    const jurisdictionHHI = computeHHI(jurisdictions, total);
    const categoryHHI = computeHHI(categories, total);
    const combinedHHI = Math.round((sourceHHI + jurisdictionHHI + categoryHHI) / 3);

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        total,
        source_hhi: sourceHHI,
        source_level: hhiLevel(sourceHHI),
        jurisdiction_hhi: jurisdictionHHI,
        jurisdiction_level: hhiLevel(jurisdictionHHI),
        category_hhi: categoryHHI,
        category_level: hhiLevel(categoryHHI),
        combined_hhi: combinedHHI,
        combined_level: hhiLevel(combinedHHI),
        top_sources: sources.slice(0, 10),
        top_jurisdictions: jurisdictions.slice(0, 10),
    };
}

// ─── Momentum ─────────────────────────────────────────────

function buildMomentumItems(items: IntelItem[], tw: TimeWindow, getter: (i: IntelItem) => string[]): { name: string; current: number; previous: number; change: number; delta_percent: number }[] {
    const windowMs = windowToMs(tw);
    const now = Date.now();
    const current: Record<string, number> = {};
    const previous: Record<string, number> = {};

    items.forEach((i) => {
        const t = now - getItemDate(i).getTime();
        getter(i).forEach((name) => {
            if (t < windowMs) current[name] = (current[name] || 0) + 1;
            else if (t < windowMs * 2) previous[name] = (previous[name] || 0) + 1;
        });
    });

    const names = new Set([...Object.keys(current), ...Object.keys(previous)]);
    return Array.from(names).map((name) => {
        const c = current[name] || 0;
        const p = previous[name] || 0;
        const change = c - p;
        const delta_percent = p === 0 ? (c > 0 ? 100 : 0) : Number((((c - p) / p) * 100).toFixed(1));
        return { name, current: c, previous: p, change, delta_percent };
    }).sort((a, b) => Math.abs(b.delta_percent) - Math.abs(a.delta_percent));
}

export function buildMomentum(items: IntelItem[], tw: TimeWindow): MomentumResponse {
    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        categories: buildMomentumItems(items, tw, (i) => [mapCategory(i)]).slice(0, 10),
        publishers: buildMomentumItems(items, tw, (i) => [i.source]).slice(0, 10),
    };
}

// ─── Risk index ───────────────────────────────────────────

export function buildRiskIndex(items: IntelItem[], tw: TimeWindow): RiskIndexResponse {
    const filtered = filterByWindow(items, tw);
    const total = filtered.length || 1;
    const incidents = filtered.filter((i) => mapCategory(i) === 'incidents').length;
    const lowConf = filtered.filter((i) => (i.relevanceScore || 2.5) / 5 < 0.4).length;
    const alertCount = buildAlerts(items, tw).alerts.filter((a) => a.severity === 'high').length;
    const concentration = buildConcentration(items, tw);

    const incidentsRatio = incidents / total;
    const lowConfRatio = lowConf / total;

    let score = Math.round(incidentsRatio * 30 + lowConfRatio * 25 + (concentration.combined_hhi / 10000) * 25 + Math.min(alertCount * 5, 20));
    score = Math.max(0, Math.min(100, score));

    const reasons: string[] = [];
    if (incidentsRatio > 0.1) reasons.push('Elevated incident ratio');
    if (lowConfRatio > 0.2) reasons.push('High proportion of low-confidence items');
    if (concentration.combined_level === 'high') reasons.push('High source/jurisdiction concentration');
    if (alertCount > 0) reasons.push(`${alertCount} high-severity alert(s)`);
    if (reasons.length === 0) reasons.push('No significant risk signals detected');

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        score,
        level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
        total: filtered.length,
        incidents,
        low_confidence: lowConf,
        high_alert_count: alertCount,
        incidents_ratio: Number(incidentsRatio.toFixed(3)),
        low_confidence_ratio: Number(lowConfRatio.toFixed(3)),
        combined_hhi: concentration.combined_hhi,
        reasons,
    };
}

// ─── Entity momentum ─────────────────────────────────────

export function buildEntityMomentum(items: IntelItem[], tw: TimeWindow): EntityMomentumResponse {
    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        entities: buildMomentumItems(items, tw, (i) => i.entities).slice(0, 20),
    };
}

// ─── Risk trend ───────────────────────────────────────────

export function buildRiskTrend(items: IntelItem[], tw: TimeWindow): RiskTrendResponse {
    const bucketCount = 12;
    const windowMs = windowToMs(tw);
    const bucketMs = windowMs / bucketCount;
    const now = Date.now();

    const xAxis: string[] = [];
    const riskScores: number[] = [];
    const incidentsRatios: number[] = [];
    const lowConfRatios: number[] = [];

    for (let i = bucketCount - 1; i >= 0; i--) {
        const start = now - (i + 1) * bucketMs;
        const end = now - i * bucketMs;
        xAxis.push(new Date(end).toISOString().slice(0, 10));

        const bucket = items.filter((item) => {
            const t = getItemDate(item).getTime();
            return t >= start && t < end;
        });

        const total = bucket.length || 1;
        const incidents = bucket.filter((item) => mapCategory(item) === 'incidents').length;
        const lowConf = bucket.filter((item) => (item.relevanceScore || 2.5) / 5 < 0.4).length;
        const incRatio = incidents / total;
        const lcRatio = lowConf / total;

        riskScores.push(Math.round(incRatio * 50 + lcRatio * 50));
        incidentsRatios.push(Number((incRatio * 100).toFixed(1)));
        lowConfRatios.push(Number((lcRatio * 100).toFixed(1)));
    }

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        xAxis,
        risk_score: riskScores,
        incidents_ratio_pct: incidentsRatios,
        low_confidence_ratio_pct: lowConfRatios,
    };
}

// ─── Summary bullets ─────────────────────────────────────

export function buildSummary(items: IntelItem[], tw: TimeWindow): SummaryResponse {
    const filtered = filterByWindow(items, tw);
    const sources = countField(filtered, (i) => [i.source]);
    const entities = countField(filtered, (i) => i.entities);
    const categories = countField(filtered, (i) => [mapCategory(i)]);

    const bullets: string[] = [];
    bullets.push(`${filtered.length} items tracked in this time window.`);
    if (categories[0]) bullets.push(`Top category: ${categories[0].name} (${categories[0].count} items).`);
    if (sources[0]) bullets.push(`Most active publisher: ${sources[0].name} (${sources[0].count} items).`);
    if (entities[0]) bullets.push(`Most mentioned entity: ${entities[0].name} (${entities[0].count} mentions).`);

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        bullets,
    };
}

// ─── Coverage ─────────────────────────────────────────────

export function buildCoverage(items: IntelItem[], tw: TimeWindow): CoverageResponse {
    const filtered = filterByWindow(items, tw);
    const total = filtered.length || 1;

    function withPercent(arr: { name: string; count: number }[]): { name: string; count: number; percent: number }[] {
        return arr.map((a) => ({ ...a, percent: Number(((a.count / total) * 100).toFixed(1)) }));
    }

    return {
        generated_at: new Date().toISOString(),
        time_window: tw,
        total: filtered.length,
        categories: withPercent(countField(filtered, (i) => [mapCategory(i)])),
        source_types: withPercent(countField(filtered, (i) => [i.type])),
        languages: withPercent([{ name: 'en', count: filtered.length }]),
        jurisdictions: withPercent(countField(filtered, (i) => [i.regionTag?.province || i.region || 'Canada'])),
    };
}
