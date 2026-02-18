# 🍁 AI Canada Pulse

**Real-time intelligence dashboard tracking AI developments across Canada and the world.**

AI Canada Pulse automatically monitors six data sources — news outlets, government policy feeds, academic research, GitHub repositories, startup funding, and ArXiv preprints — and surfaces the most relevant signals in a bilingual (EN/FR) dashboard.

🔗 **Live:** [ai-canada-pulse.vercel.app](https://ai-canada-pulse.vercel.app)

---

## ✨ Features

- **Live Signal Feed** — Real-time stream of AI-related developments with confidence scoring and entity extraction
- **Multi-Source Ingestion** — Google News, BetaKit, ArXiv, GitHub, Vector Institute RSS, and government policy feeds
- **Executive Briefing** — Auto-generated morning briefs with copy/download as Markdown
- **Scenario Presets** — One-click filters for Policy Pulse, Research Surge, Risk Watch, Canada Focus, and Global Sweep
- **Analytics Panels** — Hourly/weekly trends, jurisdiction breakdown, category momentum, entity tracking, and risk index
- **Source Health Monitoring** — Freshness, quality index, and coverage matrix for all data sources
- **Bilingual UI** — Full English and French interface via `next-intl`
- **Canada & World Scopes** — Dedicated views for Canadian-focused and global AI intelligence
- **Policy & Research Modes** — Simplified policy view or deep-dive research mode with extra analytics
- **Pinned Signals** — Bookmark important signals for quick reference
- **Export** — CSV and JSON export of filtered feed data

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **UI** | [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Charts** | [Apache ECharts](https://echarts.apache.org/) via `echarts-for-react` |
| **Data Store** | [Upstash Redis](https://upstash.com/) (serverless KV) |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) (EN/FR) |
| **Hosting** | [Vercel](https://vercel.com/) with cron-based auto-scanning |
| **Language** | TypeScript |

---

## 📁 Project Structure

```
ai-canada-pulse/
├── app/
│   ├── [locale]/          # Locale-routed pages (en/fr)
│   │   ├── canada/        # Canada-scoped dashboard
│   │   ├── world/         # Global-scoped dashboard
│   │   └── methods/       # Methodology explainer page
│   ├── api/v1/            # API routes
│   │   ├── feed/          # Feed endpoint with filtering
│   │   ├── backfill/      # Scan trigger (GET for cron, POST for manual)
│   │   ├── stats/         # KPIs, alerts, momentum, risk, etc.
│   │   └── sources/       # Source health endpoint
│   └── globals.css        # Design system
├── components/
│   ├── dashboard-page.tsx # Main dashboard orchestrator
│   └── dashboard/         # UI components (feed, charts, panels)
├── lib/
│   ├── scanners.ts        # Multi-source ingestion engine
│   ├── storage.ts         # Upstash Redis data layer
│   ├── adapter.ts         # Data transformation and filtering
│   ├── api.ts             # Client-side API helpers
│   └── types.ts           # TypeScript type definitions
├── messages/
│   ├── en.json            # English translations
│   └── fr.json            # French translations
├── vercel.json            # Vercel cron configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- An [Upstash Redis](https://upstash.com/) database

### Environment Variables

Create a `.env.local` file in the project root:

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: protects the scan endpoint
CRON_SECRET=your-secret-value
```

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Trigger a Scan

Populate the database by triggering a scan:

```bash
# Local (no CRON_SECRET set)
curl -X POST http://localhost:3000/api/v1/backfill/run

# With auth
curl -X POST http://localhost:3000/api/v1/backfill/run \
  -H "Authorization: Bearer your-secret-value"
```

---

## ☁️ Deployment

The app is designed for **Vercel**:

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com/)
3. Add environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `CRON_SECRET`)
4. Deploy — Vercel will auto-build and serve the app

### Automated Scanning

The `vercel.json` configures a cron job that triggers a full scan every 30 minutes:

```json
{
  "crons": [
    {
      "path": "/api/v1/backfill/run",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

> **Note:** Vercel cron jobs require the [Pro plan](https://vercel.com/docs/cron-jobs). On the Hobby plan, you can trigger scans manually or via an external scheduler.

---

## 📡 Data Sources

| Source | Type | What It Captures |
|---|---|---|
| **Google News** | News | Canadian and global AI news from thousands of outlets |
| **BetaKit** | Funding | Canadian tech startup funding and industry news |
| **ArXiv** | Research | AI preprints with Canadian institutional affiliations |
| **GitHub** | Industry | Open-source AI projects with Canadian connections |
| **Vector Institute** | Research | RSS feed from one of Canada's leading AI institutes |
| **Government of Canada** | Policy | Official AI policy announcements and consultations |

Each signal is scored for relevance (0–1) based on Canadian AI entity mentions, jurisdiction keywords, and institutional affiliations.

---

## 🔌 API Reference

All API routes are under `/api/v1/`:

| Endpoint | Method | Description |
|---|---|---|
| `/feed` | GET | Paginated feed with `time_window`, `category`, `jurisdiction`, `search` filters |
| `/backfill/run` | GET/POST | Trigger a full scan across all sources |
| `/stats/kpis` | GET | Key performance indicators (15m/1h/7d counts and deltas) |
| `/stats/alerts` | GET | Anomaly detection alerts (spikes and drops) |
| `/stats/hourly` | GET | 24-hour signal trend by category |
| `/stats/weekly` | GET | 12-week signal trend by category |
| `/stats/jurisdictions` | GET | Signal count breakdown by jurisdiction |
| `/stats/momentum` | GET | Category and publisher momentum shifts |
| `/stats/risk-index` | GET | Composite risk score |
| `/stats/confidence` | GET | Confidence score distribution |
| `/stats/coverage` | GET | Cross-dimensional coverage matrix |
| `/stats/compare` | GET | Canada vs. global signal comparison |
| `/stats/concentration` | GET | Ecosystem concentration (HHI) metrics |
| `/sources/health` | GET | Source freshness and ingestion statistics |

---

## 🌐 Internationalization

The dashboard is fully bilingual. Language files are in `messages/`:

- `en.json` — English
- `fr.json` — French

Locale routing is handled by `next-intl` middleware. Access either locale at:
- `/en/canada` — English, Canada scope
- `/fr/canada` — French, Canada scope

---

## 📄 Additional Docs

- [ROADMAP.md](./ROADMAP.md) — Feature roadmap (Now / Next / Later)
- [RUNBOOK.md](./RUNBOOK.md) — Operational procedures
- [STATUS.md](./STATUS.md) — Current project status and risks

---

## 📝 License

This project is for personal and educational use.
