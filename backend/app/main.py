from fastapi import FastAPI

from backend.app.api.v1.router import api_router

app = FastAPI(title="AI Developments Dashboard API", version="0.1.0")
app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/healthz")
async def api_healthz() -> dict[str, str]:
    return {"status": "ok", "service": "api"}
