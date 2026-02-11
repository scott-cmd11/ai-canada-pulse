# AI Canada Pulse

Live and interactive dashboard for tracking AI activity in Canada across news, research, policy, funding, and open-source signals.

The dashboard supports:
- Live feed with search and filtering
- Daily, weekly, monthly, and yearly trend views
- Historical baseline anchored to the ChatGPT moment (`2022-11-30`)
- Scheduled scans with persistent storage

## Local Run

1. Install dependencies:
```bash
npm install
```

2. Create local env file:
```bash
cp .env.example .env.local
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
```

3. Fill required env values in `.env.local`:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

4. Start app:
```bash
npm run dev
```

5. Open:
- `http://localhost:3000`

6. Trigger first aggregation:
- Click `Scan Now` in the UI
- Or call `POST /api/scan`

## Environment Variables

See `.env.example`.

Required for persistence:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Optional:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET` (recommended in production; protects cron GET endpoint)
- `GITHUB_TOKEN` (higher GitHub API rate limits)

## Scheduling

`vercel.json` is configured to run:
- `/api/scan` every 6 hours (`0 */6 * * *`, UTC)

## Deploy (Vercel)

1. Push this project to a Git repository.
2. Import the repo into Vercel.
3. Add environment variables in Vercel Project Settings.
4. Deploy.
5. Verify:
- `GET /api/stats`
- `POST /api/scan`
- Dashboard at `/`

## Notes

- If Redis env vars are missing, the app falls back to in-memory storage (not persistent).
- Scanning uses a mix of Google News RSS queries, curated Canadian feeds, arXiv, and GitHub search.
- Feed/network availability can vary; scan errors are captured and returned in the scan response.
