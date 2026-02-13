import json
from datetime import UTC, datetime

import redis.asyncio as redis
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.core.config import settings
from workers.app.celery_app import celery_app

router = APIRouter(prefix="/backfill")


class BackfillRunRequest(BaseModel):
    start_date: str = Field(default="2022-11-01")
    end_date: str | None = Field(default=None)
    per_page: int = Field(default=50, ge=10, le=200)
    max_pages_per_month: int = Field(default=3, ge=1, le=10)


@router.post("/run")
async def run_backfill(payload: BackfillRunRequest) -> dict[str, str]:
    task = celery_app.send_task(
        "workers.app.tasks.backfill_openalex_history",
        kwargs={
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "per_page": payload.per_page,
            "max_pages_per_month": payload.max_pages_per_month,
        },
    )
    return {"status": "queued", "task_id": task.id}


@router.get("/status")
async def backfill_status() -> dict[str, object]:
    client = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        raw = await client.get("backfill:status")
        if not raw:
            return {"state": "idle", "checked_at": datetime.now(UTC).isoformat()}
        return json.loads(raw)
    finally:
        await client.close()
