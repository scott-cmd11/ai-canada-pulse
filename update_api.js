const fs = require('fs');

const p = 'c:/Users/scott/coding projects/ai-canada-pulse/lib/api.ts';
let content = fs.readFileSync(p, 'utf8');

// For FeedParams
content = content.replace(
    'export interface FeedParams {',
    'export interface FeedParams {\n  scope?: "canada" | "world";'
);

content = content.replace(
    'function qsFeed(params: FeedParams): string {\n  return qsGeneric({',
    'function qsFeed(params: FeedParams): string {\n  return qsGeneric({\n    scope: params.scope,'
);

// For stats endpoints without args
const noArgs = ['fetchKpis', 'fetchHourly', 'fetchWeekly'];
noArgs.forEach(fn => {
    const pattern = new RegExp(`export async function ${fn}\\(\\): Promise<([^>]+)> {\\\n  if \\(USE_MOCK_DATA\\) return ([^;]+);\\\n  const res = await fetch\\(\\\`\\$\\{API_BASE\\}/stats/([^\`]+)\\\`, \\{ cache: "no-store" \\}\\);`);
    content = content.replace(pattern, `export async function ${fn}(scope: "canada" | "world" = "canada"): Promise<$1> {\n  if (USE_MOCK_DATA) return $2;\n  const res = await fetch(\`\${API_BASE}/stats/$3?scope=\${scope}\`, { cache: "no-store" });`);
});

// For stats endpoints with time_window args
const windowArgs = ['fetchSourcesBreakdown', 'fetchJurisdictionsBreakdown', 'fetchEntitiesBreakdown', 'fetchTagsBreakdown', 'fetchBrief', 'fetchCompare', 'fetchConfidence', 'fetchConcentration', 'fetchRiskIndex', 'fetchRiskTrend', 'fetchSummary', 'fetchAlerts'];
windowArgs.forEach(fn => {
    let search = `export async function ${fn}(time_window: TimeWindow = "7d"): Promise<`;
    if (content.includes(`export async function ${fn}(time_window: TimeWindow = "24h"): Promise<`)) {
        search = `export async function ${fn}(time_window: TimeWindow = "24h"): Promise<`;
    }

    if (content.includes(search)) {
        content = content.replace(search, search.replace('): Promise<', ', scope: "canada" | "world" = "canada"): Promise<'));

        // add &scope=${scope} to fetch URL
        if (fn === 'fetchAlerts') {
            content = content.replace(
                `/stats/alerts?time_window=\${time_window}&min_baseline=3&min_delta_percent=35&min_z_score=1.2`,
                `/stats/alerts?time_window=\${time_window}&scope=\${scope}&min_baseline=3&min_delta_percent=35&min_z_score=1.2`
            );
        } else {
            const fetchRegex = new RegExp(`await fetch\\(\\\`\\$\\{API_BASE\\}/stats/([^?]+)\\?time_window=\\\$\\{time_window\\}([^\\\`]*)\\\``, 'g');
            content = content.replace(fetchRegex, `await fetch(\`\${API_BASE}/stats/$1?time_window=\${time_window}&scope=\${scope}$2\``);
        }
    }
});

// For stats endpoints with time_window + limit
const limitArgs = ['fetchCoverage', 'fetchMomentum', 'fetchEntityMomentum'];
limitArgs.forEach(fn => {
    const searchStr = content.match(new RegExp(`export async function ${fn}\\([^)]*\\): Promise<`));
    if (searchStr) {
        content = content.replace(searchStr[0], searchStr[0].replace('): Promise<', ', scope: "canada" | "world" = "canada"): Promise<'));

        const fetchRegex = new RegExp(`await fetch\\(\\\`\\$\\{API_BASE\\}/stats/([^?]+)\\?time_window=\\\$\\{time_window\\}&limit=\\\$\\{limit\\}\\\``, 'g');
        content = content.replace(fetchRegex, `await fetch(\`\${API_BASE}/stats/$1?time_window=\${time_window}&limit=\${limit}&scope=\${scope}\``);
    }
});

fs.writeFileSync(p, content);
console.log('Done API updates');
