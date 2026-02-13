# AI Canada Pulse Runbook

## Start Stack
```powershell
docker compose up --build -d
```

## Core Health Checks
```powershell
curl.exe -s http://localhost:8000/healthz
curl.exe -s http://localhost:8000/api/v1/sources/health
curl.exe -s http://localhost:8000/api/v1/feed?time_window=24h&page=1&page_size=5
```

## Worker and Ingestion
```powershell
docker compose logs worker --tail=120
docker compose restart worker
```

## Backfill
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

curl.exe -s http://localhost:8000/api/v1/backfill/status
```

## Build Validation
```powershell
python -m compileall backend workers
cd frontend
npm run build
```

## Continuous Autonomous Pass Protocol
- Goal: continuous improvement without repeated pause/confirm loops.
- Loop: implement -> validate -> commit -> push -> continue.
- Stop conditions:
- build fails twice in a row on same pass
- missing secrets/credentials block required steps
- destructive action would be required and not explicitly requested
