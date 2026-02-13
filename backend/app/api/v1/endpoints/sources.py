import json
from datetime import UTC, datetime

import redis.asyncio as redis
from fastapi import APIRouter

from backend.app.core.config import settings

router = APIRouter(prefix="/sources")


@router.get("/health")
async def sources_health() -> dict[str, object]:
    client = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        raw = await client.get("source_health:latest")
        if not raw:
            return {"updated_at": datetime.now(UTC).isoformat(), "sources": []}
        return json.loads(raw)
    finally:
        await client.close()
