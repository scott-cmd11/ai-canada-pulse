import json
from datetime import UTC, datetime, timedelta

import redis.asyncio as redis
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.models.source_tracking import SourceIngestRun, SourceIngestState
from workers.app.source_registry import list_source_definitions

router = APIRouter(prefix="/sources")


def _parse_window(value: str) -> timedelta:
    mapping = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    return mapping.get(value, timedelta(hours=24))


@router.get("/health")
async def sources_health(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    now = datetime.now(UTC)

    redis_payload: dict[str, object] = {}
    client = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        raw = await client.get("source_health:latest")
        if raw:
            redis_payload = json.loads(raw)
    except Exception:
        redis_payload = {}
    finally:
        await client.close()

    redis_sources: dict[str, dict[str, object]] = {}
    for entry in redis_payload.get("sources", []):
        if isinstance(entry, dict) and entry.get("source"):
            redis_sources[str(entry["source"])] = entry

    states = (await db.execute(select(SourceIngestState))).scalars().all()
    states_by_key = {state.source_key: state for state in states}

    health_rows: list[dict[str, object]] = []
    for source in list_source_definitions(include_disabled=True):
        row = dict(redis_sources.get(source.key, {}))
        state = states_by_key.get(source.key)

        row.setdefault("source", source.key)
        row["display_name"] = source.display_name
        row["enabled"] = source.enabled
        row["cadence_minutes"] = source.cadence_minutes
        row["source_type"] = source.source_type
        row["acquisition_mode"] = source.acquisition_mode

        if state is not None:
            row["last_success_at"] = state.last_success_at.isoformat() if state.last_success_at else None
            row["last_error_at"] = state.last_error_at.isoformat() if state.last_error_at else None
            row["next_run_at"] = state.next_run_at.isoformat() if state.next_run_at else None
            row["consecutive_failures"] = int(state.consecutive_failures)
            if state.last_success_at:
                row["freshness_lag_minutes"] = max(0, int((now - state.last_success_at).total_seconds() // 60))
            else:
                row.setdefault("freshness_lag_minutes", None)
        else:
            row.setdefault("last_success_at", None)
            row.setdefault("last_error_at", None)
            row.setdefault("next_run_at", None)
            row.setdefault("consecutive_failures", 0)
            row.setdefault("freshness_lag_minutes", None)

        if "status" not in row:
            if not source.enabled:
                row["status"] = "disabled"
            elif int(row.get("consecutive_failures", 0)) > 0:
                row["status"] = "error"
            elif row.get("last_success_at"):
                row["status"] = "ok"
            else:
                row["status"] = "idle"

        row.setdefault("fetched", 0)
        row.setdefault("accepted", 0)
        row.setdefault("inserted", 0)
        row.setdefault("duplicates", 0)
        row.setdefault("write_errors", 0)
        row.setdefault("duration_ms", 0)
        row.setdefault("error", "")
        row.setdefault("last_run", row.get("last_success_at") or now.isoformat())

        health_rows.append(row)

    health_rows.sort(key=lambda row: (not bool(row.get("enabled", False)), str(row.get("source", ""))))

    return {
        "updated_at": now.isoformat(),
        "run_status": str(redis_payload.get("run_status", "ok")),
        "sources": health_rows,
        "inserted_total": sum(int(row.get("inserted", 0)) for row in health_rows),
        "candidates_total": sum(int(row.get("accepted", 0)) for row in health_rows),
        "skipped_lock_count": int(redis_payload.get("skipped_lock_count", 0)),
    }


@router.get("/catalog")
async def sources_catalog() -> dict[str, object]:
    return {
        "updated_at": datetime.now(UTC).isoformat(),
        "count": len(list_source_definitions(include_disabled=True)),
        "sources": [
            {
                "source": source.key,
                "display_name": source.display_name,
                "enabled": source.enabled,
                "cadence_minutes": source.cadence_minutes,
                "source_type": source.source_type,
                "acquisition_mode": source.acquisition_mode,
            }
            for source in list_source_definitions(include_disabled=True)
        ],
    }


@router.get("/runs")
async def source_runs(
    source: str | None = Query(default=None),
    window: str = Query(default="24h", pattern="^(24h|7d|30d)$"),
    limit: int = Query(default=200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    now = datetime.now(UTC)
    since = now - _parse_window(window)

    stmt = select(SourceIngestRun).where(SourceIngestRun.started_at >= since)
    if source:
        stmt = stmt.where(SourceIngestRun.source_key == source)

    rows = (await db.execute(stmt.order_by(SourceIngestRun.started_at.desc()).limit(limit))).scalars().all()

    return {
        "window": window,
        "source": source,
        "count": len(rows),
        "runs": [
            {
                "id": str(row.id),
                "source": row.source_key,
                "status": row.status,
                "started_at": row.started_at.isoformat(),
                "finished_at": row.finished_at.isoformat(),
                "duration_ms": row.duration_ms,
                "fetched": row.fetched,
                "accepted": row.accepted,
                "inserted": row.inserted,
                "duplicates": row.duplicates,
                "write_errors": row.write_errors,
                "error": row.error,
                "details": row.details,
            }
            for row in rows
        ],
    }
