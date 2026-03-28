# Data Integrity Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform AI Canada Pulse into a fully verifiable, fact-driven platform where every data point links to its primary source and every AI-generated content is clearly labeled.

**Architecture:** Central source registry defines all data streams. Province config stripped of fabricated content. New reusable UI components (`AILabel`, `SourceAttribution`, `ProvinceIndex`) provide consistent attribution. Methodology page auto-generates from registry. Province pages fall back to national data with clear labeling.

**Tech Stack:** Next.js 14 App Router, React 19, TypeScript, CSS custom variables, Vercel KV (Upstash Redis)

**Spec:** `docs/superpowers/specs/2026-03-26-data-integrity-overhaul-design.md`

**Note:** No test framework is configured. Verification is done via `npm run build` and visual inspection in dev server. Each task ends with a build check and commit.

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `frontend/src/lib/source-registry.ts` | Central registry of all data sources with metadata |
| `frontend/src/components/AILabel.tsx` | Reusable label for AI-classified or AI-generated content |
| `frontend/src/components/SourceAttribution.tsx` | Reusable section footer linking to data source |
| `frontend/src/components/ScopeLabel.tsx` | Provincial vs National scope indicator |
| `frontend/src/components/ProvinceIndex.tsx` | Editorial province table replacing the map |

### Modified files

| File | Change summary |
|------|---------------|
| `frontend/src/lib/provinces-config.ts` | Remove `aiHub`, rename `lab`→`institute`, add required `url`, rewrite descriptions |
| `frontend/src/app/provinces/[slug]/page.tsx` | Update `type === "lab"` → `type === "institute"`, remove `aiHub` references |
| `frontend/src/components/ProvincePreviewPanel.tsx` | Remove `aiHub` reference |
| `frontend/src/components/ProvinceInstitutions.tsx` | Update `type === "lab"` → `type === "institute"` |
| `frontend/src/hooks/usePolling.ts` | Add `fallbackUrl`, `isEmpty` predicate, `isFallback` return field |
| `frontend/src/app/dashboard/page.tsx` | Swap `ProvinceMapSection` → `ProvinceIndex`, add source attributions |
| `frontend/src/components/StoryFeed.tsx` | Add `AILabel` for summaries and classifications |
| `frontend/src/components/IndicatorsSection.tsx` | Add `SourceAttribution` footer |
| `frontend/src/components/TrendsInsightsSection.tsx` | Add `SourceAttribution` footer |
| `frontend/src/components/LabFeedsSection.tsx` | Add `SourceAttribution` footer, add URLs to lab entries |
| `frontend/src/app/methodology/page.tsx` | Rewrite to auto-generate from source registry, fix dark mode |

---

## Task 1: Create Source Registry

**Files:**
- Create: `frontend/src/lib/source-registry.ts`

This is the foundation. All other tasks reference it.

**Note:** The spec lists 7 current sources. This registry includes 12 entries because the codebase has additional active client libraries (`gdelt-client.ts`, `huggingface-client.ts`, `epoch-client.ts`, `alliance-client.ts`, `statcan-sdmx-client.ts`) that are already fetching data. Registering them formalizes what already exists.

- [ ] **Step 1: Create the source registry file**

Create `frontend/src/lib/source-registry.ts` with the `DataSource` interface and all current data sources registered. Map each source to its existing client library file:

```typescript
export interface DataSource {
  id: string
  name: string
  url: string
  description: string
  type: "news" | "research" | "government" | "jobs" | "market" | "trends" | "registry"
  refreshInterval: string
  clientFile: string
  dataScope: "national" | "provincial" | "both"
  reliability: "primary" | "aggregated" | "community"
  fetchMethod: "rss" | "api" | "scrape" | "manual"
}

export const SOURCES: DataSource[] = [
  {
    id: "rss-news",
    name: "Canadian News Feeds",
    url: "https://news.google.com",
    description: "AI-related news from Google News, BetaKit, and CBC Technology RSS feeds",
    type: "news",
    refreshInterval: "6h",
    clientFile: "rss-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "rss",
  },
  {
    id: "arxiv",
    name: "arXiv.org",
    url: "https://arxiv.org",
    description: "Pre-print research papers in AI and machine learning with Canadian-affiliated authors",
    type: "research",
    refreshInterval: "12h",
    clientFile: "arxiv-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "openparliament",
    name: "OpenParliament.ca",
    url: "https://openparliament.ca",
    description: "Mentions of artificial intelligence in Canadian parliamentary proceedings (Hansard)",
    type: "government",
    refreshInterval: "24h",
    clientFile: "parliament-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "google-trends",
    name: "Google Trends",
    url: "https://trends.google.com",
    description: "Search interest for AI-related terms across Canadian provinces",
    type: "trends",
    refreshInterval: "12h",
    clientFile: "trends-regional-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "api",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    description: "Trending open-source AI repositories and Canadian developer activity",
    type: "research",
    refreshInterval: "12h",
    clientFile: "github-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "jobs",
    name: "Indeed Canada",
    url: "https://ca.indeed.com",
    description: "AI and machine learning job postings across Canada",
    type: "jobs",
    refreshInterval: "12h",
    clientFile: "jobs-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "rss",
  },
  {
    id: "stocks",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com",
    description: "Stock performance for Canadian AI-related public companies",
    type: "market",
    refreshInterval: "6h",
    clientFile: "stocks-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "gdelt",
    name: "GDELT Project",
    url: "https://www.gdeltproject.org",
    description: "Global event database tracking AI-related events mentioning Canada",
    type: "news",
    refreshInterval: "6h",
    clientFile: "gdelt-client.ts",
    dataScope: "national",
    reliability: "aggregated",
    fetchMethod: "api",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    url: "https://huggingface.co",
    description: "AI model repository activity and Canadian-affiliated model releases",
    type: "research",
    refreshInterval: "24h",
    clientFile: "huggingface-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "epoch-ai",
    name: "Epoch AI",
    url: "https://epochai.org",
    description: "AI model benchmarks and compute trend data",
    type: "research",
    refreshInterval: "weekly",
    clientFile: "epoch-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "alliance-compute",
    name: "Digital Research Alliance of Canada",
    url: "https://alliancecan.ca",
    description: "National research compute cluster status and availability",
    type: "research",
    refreshInterval: "6h",
    clientFile: "alliance-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "statcan",
    name: "Statistics Canada",
    url: "https://www.statcan.gc.ca",
    description: "Labour force and economic data related to AI-sector employment",
    type: "registry",
    refreshInterval: "weekly",
    clientFile: "statcan-sdmx-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
]

export function getSourceById(id: string): DataSource | undefined {
  return SOURCES.find((s) => s.id === id)
}

export function getSourcesByType(type: DataSource["type"]): DataSource[] {
  return SOURCES.filter((s) => s.type === type)
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/source-registry.ts
git commit -m "feat: add central source registry for all data streams"
```

---

## Task 2: Create AILabel Component

**Files:**
- Create: `frontend/src/components/AILabel.tsx`

Small, self-contained component. No external dependencies besides CSS variables.

- [ ] **Step 1: Create the AILabel component**

Create `frontend/src/components/AILabel.tsx`:

```tsx
'use client'

import Link from 'next/link'

interface AILabelProps {
  level: 'classification' | 'summary'
  /** Optional source article URL shown alongside summary labels */
  sourceUrl?: string
  /** Optional source name shown alongside summary labels */
  sourceName?: string
}

export default function AILabel({ level, sourceUrl, sourceName }: AILabelProps) {
  if (level === 'classification') {
    return (
      <Link
        href="/methodology#ai-processing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
          <path d="M5 3v2M5 6.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        AI-classified
      </Link>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '8px',
      }}
    >
      <Link
        href="/methodology#ai-processing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
          <path d="M5 3v2M5 6.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        AI-generated summary
      </Link>
      {sourceUrl && (
        <>
          <span style={{ color: 'var(--border-subtle)' }}>·</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
          >
            {sourceName || 'Source'} →
          </a>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AILabel.tsx
git commit -m "feat: add AILabel component for AI attribution"
```

---

## Task 3: Create SourceAttribution Component

**Files:**
- Create: `frontend/src/components/SourceAttribution.tsx`

Reads from the source registry and renders a section footer.

- [ ] **Step 1: Create the SourceAttribution component**

Create `frontend/src/components/SourceAttribution.tsx`:

```tsx
import { getSourceById } from '@/lib/source-registry'

interface SourceAttributionProps {
  sourceId: string
}

export default function SourceAttribution({ sourceId }: SourceAttributionProps) {
  const source = getSourceById(sourceId)
  if (!source) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '6px',
        padding: '12px 0 0',
        marginTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        letterSpacing: '0.02em',
      }}
    >
      Data from{' '}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {source.name} →
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SourceAttribution.tsx
git commit -m "feat: add SourceAttribution component for data provenance"
```

---

## Task 4: Strip Fabricated Content from provinces-config.ts

**Files:**
- Modify: `frontend/src/lib/provinces-config.ts`
- Modify: `frontend/src/app/provinces/[slug]/page.tsx` (update `type === "lab"` references)
- Modify: `frontend/src/components/ProvincePreviewPanel.tsx` (remove `aiHub` reference)

This task removes all fabricated data and makes every claim verifiable.

- [ ] **Step 1: Search all usages of `aiHub` and `type === "lab"`**

Before editing, grep the codebase to find every reference:

```bash
cd frontend && grep -rn "aiHub" src/
cd frontend && grep -rn '"lab"' src/
```

Confirm the locations match what the spec identified: `provinces-config.ts`, `ProvinceIndexSection.tsx`, `ProvincePreviewPanel.tsx`, `provinces/[slug]/page.tsx`.

- [ ] **Step 2: Update the ProvinceConfig and InstitutionConfig interfaces**

In `frontend/src/lib/provinces-config.ts`:

1. Remove `aiHub: string` from `ProvinceConfig` interface
2. Change `InstitutionConfig.type` from `"lab" | "university" | "company"` to `"institute" | "university" | "company"`
3. Change `InstitutionConfig.url` from optional (`url?: string`) to required (`url: string`)

- [ ] **Step 3: Update all 11 province entries**

For each province entry in the `PROVINCES` array:

1. **Remove** the `aiHub` field entirely
2. **Replace** `description` with a factual one-liner (see examples below)
3. **Rename** `type: "lab"` to `type: "institute"` for Vector, Mila, CIFAR, Amii
4. **Add** required `url` field to every institution entry
5. **Remove** any institution that cannot be linked to a real verifiable URL

Example factual descriptions:
- Ontario: `"Canada's most populous province. Home to Vector Institute and CIFAR — two of three Pan-Canadian AI institutes."`
- Quebec: `"Home to Mila, the world's largest academic deep-learning research institute."`
- Alberta: `"Home to Amii, the third Pan-Canadian AI institute, at the University of Alberta."`
- British Columbia: `"Home to D-Wave Systems, a global leader in quantum computing, and two major research universities."`
- Saskatchewan: `"The University of Saskatchewan hosts AI research programs focused on agriculture and natural resources."`
- Manitoba: `"The University of Manitoba has growing AI and data science research programs."`
- Nova Scotia: `"Dalhousie University leads AI research in Atlantic Canada with a focus on ocean technology."`
- New Brunswick: `"The University of New Brunswick hosts the Canadian Institute for Cybersecurity."`
- Newfoundland & Labrador: `"Memorial University conducts AI research applied to ocean science and offshore energy."`
- PEI: `"The University of Prince Edward Island has emerging computer science programs."`
- Northern Territories: `"Canada's three northern territories have limited but growing digital infrastructure."`

Example institution URLs:
- `{ name: "Vector Institute", type: "institute", url: "https://vectorinstitute.ai" }`
- `{ name: "Mila", type: "institute", url: "https://mila.quebec" }`
- `{ name: "CIFAR", type: "institute", url: "https://cifar.ca" }`
- `{ name: "Amii", type: "institute", url: "https://amii.ca" }`
- `{ name: "University of Toronto", type: "university", url: "https://web.cs.toronto.edu" }`
- `{ name: "University of Waterloo", type: "university", url: "https://uwaterloo.ca/artificial-intelligence-group" }`
- `{ name: "Cohere", type: "company", url: "https://cohere.com" }`
- `{ name: "Shopify", type: "company", url: "https://shopify.engineering" }`
- `{ name: "McGill University", type: "university", url: "https://www.cs.mcgill.ca" }`
- `{ name: "Université de Montréal", type: "university", url: "https://diro.umontreal.ca" }`
- `{ name: "D-Wave", type: "company", url: "https://www.dwavesys.com" }`
- `{ name: "University of British Columbia", type: "university", url: "https://www.cs.ubc.ca" }`
- `{ name: "Simon Fraser University", type: "university", url: "https://www.sfu.ca/computing.html" }`
- `{ name: "University of Alberta", type: "university", url: "https://www.ualberta.ca/computing-science" }`
- `{ name: "University of Saskatchewan", type: "university", url: "https://cs.usask.ca" }`
- `{ name: "University of Manitoba", type: "university", url: "https://sci.umanitoba.ca/cs" }`
- `{ name: "Dalhousie University", type: "university", url: "https://www.dal.ca/faculty/computerscience.html" }`
- `{ name: "University of New Brunswick", type: "university", url: "https://www.unb.ca/cic" }`
- `{ name: "Memorial University of Newfoundland", type: "university", url: "https://www.mun.ca/computerscience" }`
- `{ name: "University of Prince Edward Island", type: "university", url: "https://www.upei.ca/programs/computer-science" }`

Remove `{ name: "Element AI (legacy)", type: "company" }` from Quebec — no longer exists as a company (acquired by ServiceNow 2020, brand dissolved).

- [ ] **Step 4: Update province page to use "institute" instead of "lab"**

In `frontend/src/app/provinces/[slug]/page.tsx`:
- Change `i.type === 'lab'` to `i.type === 'institute'` (around line 41)
- Remove any reference to `province.aiHub` (check the hero section and stats ribbon)

- [ ] **Step 5: Update ProvincePreviewPanel to remove aiHub**

In `frontend/src/components/ProvincePreviewPanel.tsx`:
- Remove the line that renders `province.aiHub`
- Replace with the province's first institute name if one exists, or omit

- [ ] **Step 5b: Update ProvinceInstitutions to use "institute" instead of "lab"**

In `frontend/src/components/ProvinceInstitutions.tsx`:
- Change `institution.type === 'lab'` to `institution.type === 'institute'` (around lines 47 and 49)
- Update any display label from "Lab" to "Institute" if rendered

- [ ] **Step 5c: Update province page stats ribbon — replace aiHub stat**

In `frontend/src/app/provinces/[slug]/page.tsx`, the stats ribbon has a `{ label: 'AI Hub', value: province.aiHub }` entry (around line 118-122). Replace it with:
```typescript
{
  label: 'AI Institutes',
  value: province.institutions.filter(i => i.type === 'institute').length > 0
    ? province.institutions.filter(i => i.type === 'institute').map(i => i.name).join(', ')
    : '—'
}
```
This shows the actual institute name(s) for provinces that have one, and "—" for provinces that don't. The ribbon stays at 4 items.

- [ ] **Step 6: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no TypeScript errors. The `aiHub` field removal may cause errors in `ProvinceIndexSection.tsx` — that's expected and will be resolved in Task 5 when it's replaced.

If `ProvinceIndexSection.tsx` causes build errors due to missing `aiHub`, temporarily comment out the `aiHub` reference there with a `// Removed: aiHub` note. It will be deleted entirely in Task 5.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/provinces-config.ts frontend/src/app/provinces/\[slug\]/page.tsx frontend/src/components/ProvincePreviewPanel.tsx frontend/src/components/ProvinceInstitutions.tsx
git commit -m "feat: strip fabricated content from province config, add verifiable URLs"
```

---

## Task 5: Create ProvinceIndex and Wire into Dashboard

**Files:**
- Create: `frontend/src/components/ProvinceIndex.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`

Replaces the Canada map with an editorial province table.

- [ ] **Step 1: Create the ProvinceIndex component**

Create `frontend/src/components/ProvinceIndex.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { PROVINCES } from '@/lib/provinces-config'

// Sort by population descending
const sortedProvinces = [...PROVINCES].sort((a, b) => b.population - a.population)

// Section flag labels for dot indicators
const SECTION_FLAGS = ['stories', 'trends', 'jobs', 'stocks', 'research', 'parliament'] as const

export default function ProvinceIndex() {
  return (
    <div className="saas-card" style={{ padding: '24px', overflow: 'hidden' }}>
      {/* Header row */}
      <div
        className="province-index-header"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr auto',
          gap: '12px',
          padding: '0 0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '4px',
        }}
      >
        {['Province / Territory', 'AI Institute', 'Key University', 'Data', ''].map((label) => (
          <span
            key={label || 'arrow'}
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
            className={label === 'AI Institute' || label === 'Key University' || label === 'Data' ? 'province-index-hide-mobile' : ''}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Province rows */}
      {sortedProvinces.map((province) => {
        const institute = province.institutions.find((i) => i.type === 'institute')
        const university = province.institutions.find((i) => i.type === 'university')

        return (
          <Link
            key={province.slug}
            href={`/provinces/${province.slug}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr auto',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid var(--border-subtle)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.15s',
            }}
            className="province-index-row"
          >
            {/* Province name + abbreviation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                {province.name}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                }}
              >
                {province.abbreviation}
              </span>
            </div>

            {/* AI Institute */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              {institute ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{institute.name}</span>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>

            {/* Key University */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              {university ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{university.name}</span>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>

            {/* Data section dots */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {SECTION_FLAGS.map((flag) => (
                <span
                  key={flag}
                  title={flag}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: province.sections[flag]
                      ? 'var(--accent-primary)'
                      : 'color-mix(in srgb, var(--text-muted) 20%, transparent)',
                  }}
                />
              ))}
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
            </div>
          </Link>
        )
      })}

      {/* Mobile-hide CSS */}
      <style>{`
        .province-index-row:hover {
          background-color: var(--surface-secondary, rgba(0,0,0,0.02));
        }
        @media (max-width: 768px) {
          .province-index-hide-mobile { display: none !important; }
          .province-index-row {
            grid-template-columns: 1fr auto !important;
          }
          .province-index-header {
            grid-template-columns: 1fr auto !important;
          }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard to use ProvinceIndex**

In `frontend/src/app/dashboard/page.tsx`:

1. Replace `import ProvinceMapSection from ...` (or `ProvinceIndexSection`) with `import ProvinceIndex from '@/components/ProvinceIndex'`
2. In the provinces section, replace `<ProvinceMapSection />` (or `<ProvinceIndexSection />`) with `<ProvinceIndex />`
3. Remove unused imports (`ProvinceMapSection`, `ProvinceIndexSection`)
4. Remove the `saas-card` class from the dashboard's province `<section>` wrapper (around line 36: `className="saas-card rounded-2xl overflow-hidden"`), since `ProvinceIndex` applies `saas-card` internally. Avoid double nesting.

- [ ] **Step 3: Verify build and inspect**

Run: `cd frontend && npm run build`
Expected: Build succeeds. Check dev server — the dashboard should show the editorial province table where the map used to be.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ProvinceIndex.tsx frontend/src/app/dashboard/page.tsx
git commit -m "feat: replace Canada map with editorial province index"
```

---

## Task 6: Add Source Attribution to Dashboard Sections

**Files:**
- Modify: `frontend/src/components/StoryFeed.tsx`
- Modify: `frontend/src/components/IndicatorsSection.tsx`
- Modify: `frontend/src/components/TrendsInsightsSection.tsx`
- Modify: `frontend/src/components/LabFeedsSection.tsx`

Wire `SourceAttribution` and `AILabel` into existing section components.

**Dark mode note:** `StoryCard.tsx` and `LabFeedsSection.tsx` currently use hardcoded Tailwind colors (`text-slate-950`, `bg-blue-50`, etc.) that don't respond to dark mode. The new `AILabel` and `SourceAttribution` components use CSS custom variables. For this task, we accept the visual inconsistency — a full dark mode migration of all existing components is out of scope for this overhaul. The new components are correctly themed; existing component theming is tracked as follow-up work.

- [ ] **Step 1: Add SourceAttribution to IndicatorsSection**

In `frontend/src/components/IndicatorsSection.tsx`:
1. Import: `import SourceAttribution from '@/components/SourceAttribution'`
2. Add `<SourceAttribution sourceId="stocks" />` at the bottom of the component's return, inside the outermost container div.

- [ ] **Step 2: Add SourceAttribution to TrendsInsightsSection**

In `frontend/src/components/TrendsInsightsSection.tsx`:
1. Import: `import SourceAttribution from '@/components/SourceAttribution'`
2. Add `<SourceAttribution sourceId="google-trends" />` at the bottom of the component's return.

- [ ] **Step 3: Add SourceAttribution and URLs to LabFeedsSection**

In `frontend/src/components/LabFeedsSection.tsx`:
1. Import: `import SourceAttribution from '@/components/SourceAttribution'`
2. Verify the hardcoded `LABS` array entries have correct URLs (Mila, Vector, CIFAR, Amii). These should already be correct — they are the real Pan-Canadian AI institutes.
3. Add `<SourceAttribution sourceId="alliance-compute" />` at the bottom.

- [ ] **Step 4: Add AILabel and SourceAttribution to StoryFeed**

In `frontend/src/components/StoryFeed.tsx`:
1. Import: `import AILabel from '@/components/AILabel'` and `import SourceAttribution from '@/components/SourceAttribution'`
2. Where AI summaries are rendered (stories with `aiSummary` field), add `<AILabel level="summary" sourceUrl={story.sourceUrl} sourceName={story.sourceName} />` above the summary text.
3. Where sentiment or category is displayed, add `<AILabel level="classification" />` next to the value.
4. Add `<SourceAttribution sourceId="rss-news" />` at the bottom of the component.

**Note:** The `StoryFeed` component uses `StoryCard` for rendering individual stories. The `AILabel` for summaries should be added inside `StoryCard` if that's where `aiSummary` is rendered. Check `StoryCard.tsx` to determine the right location.

- [ ] **Step 5: Verify build and inspect**

Run: `cd frontend && npm run build`
Expected: Build succeeds. Check dev server — each section should show a "Data from [Source] →" footer.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/StoryFeed.tsx frontend/src/components/IndicatorsSection.tsx frontend/src/components/TrendsInsightsSection.tsx frontend/src/components/LabFeedsSection.tsx
git commit -m "feat: add source attribution and AI labels to dashboard sections"
```

---

## Task 7: Enhance usePolling with Fallback Support

**Files:**
- Modify: `frontend/src/hooks/usePolling.ts`

Adds the national rollup fallback mechanism for province pages.

- [ ] **Step 1: Add fallback parameters to usePolling**

In `frontend/src/hooks/usePolling.ts`, update the hook to accept new options and return `isFallback`:

Current signature:
```typescript
export function usePolling<T>(
  url: string,
  opts: {
    intervalMs?: number
    transform?: (json: Record<string, unknown>) => T | null
  } = {}
)
```

New signature:
```typescript
export function usePolling<T>(
  url: string,
  opts: {
    intervalMs?: number
    transform?: (json: Record<string, unknown>) => T | null
    fallbackUrl?: string
    isEmpty?: (data: T) => boolean
  } = {}
)
```

Implementation changes:
1. Add `isFallback` to the component state: `const [isFallback, setIsFallback] = useState(false)`
2. After the primary fetch succeeds and transform is applied, check `isEmpty(data)`:
   - Default `isEmpty`: `(d) => Array.isArray(d) && d.length === 0`
   - If empty and `fallbackUrl` is provided, re-fetch from `fallbackUrl`, apply same transform, set `isFallback: true`
   - If not empty, set `isFallback: false`
3. On subsequent poll cycles, always try primary URL first
4. Return `isFallback` alongside `data`, `loading`, `lastUpdated`

Updated return:
```typescript
return { data, loading, lastUpdated, isFallback }
```

**Important:** All existing callers of `usePolling` are unaffected — `isFallback` defaults to `false`, and `fallbackUrl`/`isEmpty` are optional. No breaking changes.

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds. Existing polling behavior is unchanged (no fallback options passed by current callers).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/usePolling.ts
git commit -m "feat: add fallback URL support to usePolling for national rollup"
```

---

## Task 8: Create ScopeLabel and Wire Province Page Rollup

**Files:**
- Create: `frontend/src/components/ScopeLabel.tsx`
- Modify: `frontend/src/app/provinces/[slug]/page.tsx`

Wires the fallback mechanism into province pages.

- [ ] **Step 1: Create ScopeLabel component**

Create `frontend/src/components/ScopeLabel.tsx`:

```tsx
interface ScopeLabelProps {
  provinceName: string
  isFallback: boolean
  /** e.g. "stories", "jobs", "research", "trends" */
  dataType?: string
}

export default function ScopeLabel({ provinceName, isFallback, dataType = 'stories' }: ScopeLabelProps) {
  if (!isFallback) {
    return (
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-muted)',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        }}
      >
        {provinceName}
      </span>
    )
  }

  return (
    <div
      style={{
        fontSize: '12px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'color-mix(in srgb, var(--text-muted) 6%, transparent)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <strong style={{ color: 'var(--text-secondary)' }}>Showing national AI coverage</strong>
      <br />
      No {provinceName}-specific {dataType} found in the last 30 days.
    </div>
  )
}
```

- [ ] **Step 2: Update province page sections to use fallback**

In `frontend/src/app/provinces/[slug]/page.tsx`, for each data section that uses `usePolling`:

1. Import `ScopeLabel` from `@/components/ScopeLabel`
2. When calling `usePolling` for province-specific data, add fallback options:

```typescript
const { data: stories, loading, isFallback } = usePolling<Story[]>(
  `/api/v1/stories?region=${province.slug}`,
  {
    fallbackUrl: '/api/v1/stories',
    isEmpty: (d) => Array.isArray(d) && d.length === 0,
  }
)
```

3. Render `<ScopeLabel provinceName={province.name} isFallback={isFallback} />` above each data section.

**Note:** Only sections controlled by `province.sections` flags need this treatment (stories, trends, jobs, stocks, research, parliament). Static sections (hero, institutions, stats) don't use polling and don't need fallback.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ScopeLabel.tsx frontend/src/app/provinces/\[slug\]/page.tsx
git commit -m "feat: add scope labels and national rollup to province pages"
```

---

## Task 9: Rewrite Methodology Page

**Files:**
- Modify: `frontend/src/app/methodology/page.tsx`

Auto-generate data sources section from the registry. Migrate to CSS custom variables.

- [ ] **Step 1: Rewrite the methodology page**

In `frontend/src/app/methodology/page.tsx`:

1. Import `SOURCES` from `@/lib/source-registry` and `getSourcesByType` helper
2. **Replace** the hand-written "Data sources" section with auto-generated source listing:
   - Group sources by type using `getSourcesByType()`
   - For each type group, render a table with columns: Name (linked), Description, Refresh, Scope, Method
   - Type group headers: "News Sources", "Research", "Government", "Jobs", "Market Data", "Trends", "Registries"
3. **Rewrite** the "AI generation and caching" section as "AI Processing":
   - Classification: "gpt-4o-mini — categorizes stories by province, topic, and sentiment using keyword matching and regex rules"
   - Summarization: "gpt-4o-mini — generates brief summaries (max 150 words) of news articles"
   - Add: "AI does NOT: make editorial judgments, select or rank sources, modify original content"
   - Add an `id="ai-processing"` anchor for the `AILabel` links
4. **Replace** the "Cadence and reliability" section with per-source refresh info (already in the auto-generated table)
5. **Keep** the "Data quality and limits" section as-is
6. **Keep** the "Disclaimer" section as-is
7. **Migrate** all hardcoded Tailwind colors to CSS custom variables:
   - `bg-white` → `var(--surface-primary)`
   - `text-slate-900` → `var(--text-primary)`
   - `text-slate-600` → `var(--text-secondary)`
   - `text-slate-500` → `var(--text-muted)`
   - `bg-slate-50` → `var(--surface-secondary)`
   - `border-slate-200` → `var(--border-subtle)`

**Structure of the rewritten page:**
```
1. Header: "Methodology" (Fraunces)
2. Introduction paragraph
3. Data Sources (auto-generated from SOURCES, grouped by type)
4. AI Processing (hand-written, with id="ai-processing")
5. Data Quality & Limits (kept from current page)
6. Disclaimer (kept from current page)
```

- [ ] **Step 2: Verify build and inspect**

Run: `cd frontend && npm run build`
Expected: Build succeeds. Check dev server at `/methodology` — sources should be grouped by type, dark mode should work.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/methodology/page.tsx
git commit -m "feat: auto-generate methodology page from source registry, fix dark mode"
```

---

## Task 10: Final Cleanup and Build Verification

**Deferred from this phase:**
- **Data Freshness timestamps** (spec Section 6.4) — writing `lastFetched` to Vercel KV and the `/api/v1/source-status` API route. Deferred because it requires changes to every client library's fetch path and a new API route. Will be implemented when new data sources are added.
- **Full dark mode migration** of existing components (`StoryCard`, `LabFeedsSection`, etc.) — tracked as follow-up.

**Files:**
- Remove import: `ProvinceMapSection` from dashboard (if still imported)
- Remove import: `ProvinceIndexSection` from dashboard (if still imported)
- Keep but unused: `CanadaMap.tsx`, `ProvincePreviewPanel.tsx`, `ProvinceMapSection.tsx` (may be used later; do not delete)
- Verify: No remaining references to `aiHub` in active code
- Verify: No remaining references to `type: "lab"` in active code

- [ ] **Step 1: Search for stale references**

```bash
cd frontend && grep -rn "aiHub" src/
cd frontend && grep -rn '"lab"' src/
cd frontend && grep -rn "ProvinceMapSection" src/
cd frontend && grep -rn "ProvinceIndexSection" src/
```

Fix any remaining references found.

- [ ] **Step 2: Full build verification**

Run: `cd frontend && npm run build`
Expected: Clean build with no TypeScript errors, no warnings about missing references.

- [ ] **Step 3: Visual inspection**

Start dev server and check:
1. `/dashboard` — Province index table renders correctly with all 11 entries
2. `/dashboard` — All sections have source attribution footers
3. `/provinces/ontario` — Shows provincial data with scope label
4. `/provinces/prince-edward-island` — Shows national rollup with "Showing national AI coverage" label
5. `/methodology` — Sources auto-generated from registry, dark mode works
6. All AI summaries/classifications in story feed are labeled

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup stale references from data integrity overhaul"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|------------|-------------|
| 1 | Source Registry | None (foundation) |
| 2 | AILabel component | None |
| 3 | SourceAttribution component | Task 1 (imports registry) |
| 4 | Province config overhaul | None |
| 5 | ProvinceIndex + dashboard wiring | Task 4 (uses updated config) |
| 6 | Source attribution on sections | Tasks 1, 2, 3 |
| 7 | usePolling fallback | None |
| 8 | ScopeLabel + province rollup | Task 7 (uses enhanced hook) |
| 9 | Methodology page rewrite | Task 1 (reads registry) |
| 10 | Final cleanup & verification | All above |

**Parallelizable groups:**
- Tasks 1, 2, 4, 7 can all run in parallel (no dependencies on each other)
- Tasks 3, 5 depend on earlier tasks
- Task 6 depends on 1, 2, 3
- Task 8 depends on 7
- Task 9 depends on 1
- Task 10 is sequential (final)
