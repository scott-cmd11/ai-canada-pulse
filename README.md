# AI Canada Pulse

AI Canada Pulse is a real-time, metadata-only intelligence dashboard for tracking AI developments across Canada and global signals relevant to Canada.

It is a monorepo with:
- `frontend`: Next.js 14, TypeScript, Tailwind, `next-intl`, ECharts
- `backend`: FastAPI (async), SQLAlchemy async, Pydantic
- `workers`: Celery ingestion + backfill jobs
- `db`: PostgreSQL
- `redis`: pub/sub + task broker + health/status cache

## Current Capabilities

- Live feed via SSE (`/api/v1/feed/stream`)
- Bilingual UI routing (`/en/...`, `/fr/...`)
- Policy/Research view modes
- Filters and CSV/JSON export
- KPI, hourly, weekly charts
- Historical OpenAlex backfill endpoint + UI controls
- Synthetic cleanup endpoint + UI controls
- Source health panel (per-source fetched/accepted/inserted/duplicates/errors)
- Source mix analytics endpoint (`/api/v1/stats/sources`)

## Project Control Docs

- `ROADMAP.md`: prioritized delivery path (`Now`, `Next`, `Later`)
- `STATUS.md`: current system status, risks, and immediate next actions
- `RUNBOOK.md`: operations playbook and continuous autonomous pass protocol

## Metadata-Only Policy

The project stores metadata only:
- title
- canonical URL
- publisher
- timestamps
- classification/category/tags/entities/confidence

Full article text is not stored.

## Quick Start (Docker)

From repo root:

```powershell
docker compose up --build -d
```

Services:
- Frontend: `http://localhost:3001`
- API: `http://localhost:8000`

## Key API Endpoints

Base: `http://localhost:8000/api/v1`

- `GET /feed`
- `GET /feed/stream`
- `GET /feed/export?fmt=csv|json`
- `GET /stats/kpis`
- `GET /stats/hourly`
- `GET /stats/weekly`
- `GET /stats/sources`
- `POST /backfill/run`
- `GET /backfill/status`
- `POST /maintenance/purge-synthetic?execute=false|true`
- `GET /sources/health`

## Useful Commands

```powershell
# Rebuild only worker after ingestion changes
docker compose up --build -d worker

# View worker logs
docker compose logs worker --tail=120

# Compile check
python -m compileall backend workers

# Frontend build check
cd frontend
npm run build
```

## Backfill Example

```powershell
$body = @{
  start_date = '2022-11-01'
  end_date = '2026-02-13'
  per_page = 50
  max_pages_per_month = 2
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:8000/api/v1/backfill/run' `
  -ContentType 'application/json' `
  -Body $body
```

Check progress:

```powershell
curl.exe -s http://localhost:8000/api/v1/backfill/status
```

## Notes

- Source ingestion is dedupe-heavy once the dataset is warm; `inserted=0` on a run is normal when all items are already known.
- Use `/sources/health` and the Source Health panel to inspect ingestion behavior by source.
- CI runs on push/PR via `.github/workflows/ci.yml` and validates Python compile + frontend build.
