import asyncio
import csv
import json
from io import StringIO
from collections.abc import AsyncGenerator

import redis.asyncio as redis
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.schemas.ai_development import FeedItem, FeedResponse
from backend.app.services.feed import fetch_feed

router = APIRouter(prefix="/feed")


@router.get("", response_model=FeedResponse)
async def get_feed(
    time_window: str = Query("24h", pattern="^(1h|24h|7d|30d|90d|1y|2y|5y)$"),
    category: str | None = Query(default=None),
    jurisdiction: str | None = Query(default=None),
    language: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> FeedResponse:
    rows, total = await fetch_feed(
        db,
        time_window=time_window,
        category=category,
        jurisdiction=jurisdiction,
        language=language,
        search=search,
        page=page,
        page_size=page_size,
    )
    return FeedResponse(
        items=[FeedItem.model_validate(row, from_attributes=True) for row in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


async def _stream_events() -> AsyncGenerator[str, None]:
    client = redis.from_url(settings.redis_url, decode_responses=True)
    pubsub = client.pubsub()
    await pubsub.subscribe(settings.sse_channel)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=10.0)
            if message and message.get("type") == "message":
                payload = message.get("data")
                if isinstance(payload, dict):
                    data = json.dumps(payload)
                else:
                    data = str(payload)
                yield f"event: new_item\ndata: {data}\n\n"
            else:
                yield "event: ping\ndata: {}\n\n"
            await asyncio.sleep(0.05)
    finally:
        await pubsub.unsubscribe(settings.sse_channel)
        await pubsub.close()
        await client.close()


@router.get("/stream")
async def stream_feed() -> StreamingResponse:
    return StreamingResponse(
        _stream_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/export")
async def export_feed(
    fmt: str = Query("csv", pattern="^(csv|json)$"),
    time_window: str = Query("24h", pattern="^(1h|24h|7d|30d|90d|1y|2y|5y)$"),
    category: str | None = Query(default=None),
    jurisdiction: str | None = Query(default=None),
    language: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    rows, _ = await fetch_feed(
        db,
        time_window=time_window,
        category=category,
        jurisdiction=jurisdiction,
        language=language,
        search=search,
        page=1,
        page_size=5000,
    )
    items = [FeedItem.model_validate(row, from_attributes=True).model_dump(mode="json") for row in rows]

    if fmt == "json":
        return JSONResponse(content={"items": items, "count": len(items)})

    buffer = StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "id",
            "source_id",
            "source_type",
            "category",
            "title",
            "url",
            "publisher",
            "published_at",
            "ingested_at",
            "language",
            "jurisdiction",
            "entities",
            "tags",
            "hash",
            "confidence",
        ],
    )
    writer.writeheader()
    for item in items:
        item["entities"] = "|".join(item.get("entities", []))
        item["tags"] = "|".join(item.get("tags", []))
        writer.writerow(item)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ai-developments-export.csv"'},
    )
