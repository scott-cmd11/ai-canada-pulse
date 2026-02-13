import asyncio
import hashlib
import json
import random
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from datetime import date as date_type
from time import perf_counter
from typing import Any

import redis.asyncio as redis
from celery import shared_task
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.models.ai_development import AIDevelopment, CategoryType, SourceType
from workers.app.source_adapters import (
    fetch_betakit_ai_metadata,
    fetch_canada_gov_metadata,
    fetch_google_news_canada_ai_metadata,
    fetch_openalex_metadata,
)
from workers.app.backfill import fetch_openalex_month, month_windows

PUBLISHERS = [
    ("OpenAlex", SourceType.academic, CategoryType.research, "Global"),
    ("ISED", SourceType.gov, CategoryType.policy, "Canada"),
    ("BetaKit", SourceType.media, CategoryType.news, "Canada"),
    ("Vector Institute", SourceType.academic, CategoryType.research, "Ontario"),
    ("Mila", SourceType.academic, CategoryType.research, "Quebec"),
    ("Amii", SourceType.academic, CategoryType.research, "Alberta"),
    ("CIFAR", SourceType.industry, CategoryType.industry, "Canada"),
]

TITLE_STEMS = [
    "New foundation model benchmark released for multilingual evaluation",
    "Federal consultation opens on AI procurement guardrails",
    "Canadian startup secures funding for sovereign compute orchestration",
    "AI safety incident taxonomy updated by industry coalition",
    "Hospital consortium pilots diagnostic copilots in bilingual workflows",
    "Open-source retrieval stack improves low-resource French performance",
]

ENTITIES = [
    ["Government of Canada", "ISED", "AIDA"],
    ["Mila", "Yoshua Bengio"],
    ["Vector Institute", "University of Toronto"],
    ["Amii", "University of Alberta"],
    ["OpenAlex", "Crossref"],
]

TAG_BANK = [
    "compute",
    "healthcare",
    "regulation",
    "safety",
    "evaluation",
    "bilingual",
    "infrastructure",
    "funding",
]
MIN_CONFIDENCE = 0.82
MIN_CANADA_RELEVANCE = 0.45
BACKFILL_MIN_CONFIDENCE = 0.72
BACKFILL_MIN_CANADA_RELEVANCE = 0.30
CANADA_FOCUS_ENTITIES = {
    "Government of Canada",
    "ISED",
    "CIFAR",
    "Mila",
    "Vector Institute",
    "Amii",
    "University of Toronto",
    "University of Alberta",
}
SOURCE_HEALTH_KEY = "source_health:latest"


def _enum_or_str(value: object) -> str:
    if hasattr(value, "value"):
        return str(getattr(value, "value"))
    return str(value)


def _source_key_for_record(record_data: dict[str, object]) -> str:
    publisher = str(record_data.get("publisher", "")).lower()
    if publisher == "openalex":
        return "openalex"
    if publisher == "government of canada":
        return "canada_gov_ised"
    if publisher == "betakit":
        return "betakit_ai"
    if publisher:
        return "google_news_canada_ai"
    return "unknown"


def _fingerprint(source_id: str, url: str, published_at: datetime) -> str:
    material = f"{source_id}|{url}|{published_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _generate_item() -> dict[str, object]:
    canada_publishers = [entry for entry in PUBLISHERS if entry[3] in {"Canada", "Ontario", "Quebec", "Alberta"}]
    publisher, source_type, default_category, jurisdiction = random.choice(canada_publishers)
    title = random.choice(TITLE_STEMS)
    if source_type == SourceType.funding:
        category = CategoryType.funding
    else:
        category = default_category

    published_at = datetime.now(UTC) - timedelta(minutes=random.randint(0, 240))
    source_id = f"{publisher.lower().replace(' ', '-')}-{uuid.uuid4().hex[:12]}"
    language = random.choice(["en", "fr", "en"])
    url = f"https://example.com/{source_id}"
    entities = random.choice(ENTITIES[:4])
    tags = random.sample(TAG_BANK, k=random.randint(2, 4))
    confidence = round(random.uniform(0.84, 0.98), 2)

    return {
        "source_id": source_id,
        "source_type": source_type,
        "category": category,
        "title": title,
        "url": url,
        "publisher": publisher,
        "published_at": published_at,
        "language": language,
        "jurisdiction": jurisdiction,
        "entities": entities,
        "tags": tags,
        "hash": _fingerprint(source_id, url, published_at),
        "confidence": confidence,
        "relevance_score": round(random.uniform(0.65, 0.98), 2),
    }


def _is_canada_relevant(
    item: dict[str, object],
    *,
    min_confidence: float = MIN_CONFIDENCE,
    min_relevance: float = MIN_CANADA_RELEVANCE,
) -> bool:
    confidence = float(item.get("confidence", 0.0))
    relevance = float(item.get("relevance_score", 0.0))
    jurisdiction = str(item.get("jurisdiction", "Global"))
    entities = {str(e) for e in item.get("entities", [])}

    if confidence < min_confidence:
        return False
    if relevance >= min_relevance:
        return True
    if jurisdiction in {"Canada", "Ontario", "Quebec", "Alberta", "British Columbia"}:
        return True
    if entities.intersection(CANADA_FOCUS_ENTITIES):
        return True
    return False


async def _set_backfill_status(client: redis.Redis, payload: dict[str, object]) -> None:
    await client.set("backfill:status", json.dumps(payload))


async def _set_source_health(client: redis.Redis, payload: dict[str, object]) -> None:
    await client.set(SOURCE_HEALTH_KEY, json.dumps(payload))


async def _load_candidate_items() -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    source_fetchers: list[tuple[str, Callable[[], Awaitable[list[dict[str, object]]]]]] = [
        ("openalex", lambda: fetch_openalex_metadata(limit=6)),
        ("canada_gov_ised", lambda: fetch_canada_gov_metadata(limit=6)),
        ("betakit_ai", lambda: fetch_betakit_ai_metadata(limit=8)),
        ("google_news_canada_ai", lambda: fetch_google_news_canada_ai_metadata(limit=10)),
    ]

    merged_by_hash: dict[str, dict[str, object]] = {}
    health: list[dict[str, object]] = []
    for source_name, fetcher in source_fetchers:
        started = perf_counter()
        try:
            source_items = await fetcher()
            filtered = [item for item in source_items if _is_canada_relevant(item)]
            for item in filtered:
                item_hash = str(item.get("hash", ""))
                if not item_hash:
                    continue
                if item_hash not in merged_by_hash:
                    merged_by_hash[item_hash] = item

            health.append(
                {
                    "source": source_name,
                    "status": "ok",
                    "fetched": len(source_items),
                    "accepted": len(filtered),
                    "inserted": 0,
                    "duplicates": 0,
                    "write_errors": 0,
                    "duration_ms": int((perf_counter() - started) * 1000),
                    "last_run": datetime.now(UTC).isoformat(),
                    "error": "",
                }
            )
        except Exception as exc:
            health.append(
                {
                    "source": source_name,
                    "status": "error",
                    "fetched": 0,
                    "accepted": 0,
                    "inserted": 0,
                    "duplicates": 0,
                    "write_errors": 0,
                    "duration_ms": int((perf_counter() - started) * 1000),
                    "last_run": datetime.now(UTC).isoformat(),
                    "error": str(exc),
                }
            )

    items = list(merged_by_hash.values())
    if not items and settings.enable_synthetic_fallback:
        items = [_generate_item() for _ in range(random.randint(1, 3))]
        health.append(
            {
                "source": "synthetic_fallback",
                "status": "ok",
                "fetched": len(items),
                "accepted": len(items),
                "inserted": 0,
                "duplicates": 0,
                "write_errors": 0,
                "duration_ms": 0,
                "last_run": datetime.now(UTC).isoformat(),
                "error": "",
            }
        )

    if not items and settings.enable_synthetic_fallback:
        items = [_generate_item() for _ in range(random.randint(1, 2))]
    return items, health


async def _insert_and_publish() -> int:
    inserted = 0
    client = redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    candidates, source_health = await _load_candidate_items()
    inserted_by_source: dict[str, int] = {}
    duplicates_by_source: dict[str, int] = {}
    write_errors_by_source: dict[str, int] = {}
    for candidate in candidates:
        source_name = _source_key_for_record(candidate)
        inserted_by_source[source_name] = inserted_by_source.get(source_name, 0)
        duplicates_by_source[source_name] = duplicates_by_source.get(source_name, 0)
        write_errors_by_source[source_name] = write_errors_by_source.get(source_name, 0)

    async with SessionLocal() as session:
        for record_data in candidates:
            source_name = _source_key_for_record(record_data)
            record_data.pop("relevance_score", None)
            model = AIDevelopment(**record_data)
            session.add(model)
            try:
                await session.commit()
            except IntegrityError:
                await session.rollback()
                duplicates_by_source[source_name] = duplicates_by_source.get(source_name, 0) + 1
                continue
            except Exception:
                await session.rollback()
                write_errors_by_source[source_name] = write_errors_by_source.get(source_name, 0) + 1
                continue

            inserted += 1
            inserted_by_source[source_name] = inserted_by_source.get(source_name, 0) + 1
            payload = {
                "id": str(model.id),
                "source_id": model.source_id,
                "source_type": _enum_or_str(model.source_type),
                "category": _enum_or_str(model.category),
                "title": model.title,
                "url": model.url,
                "publisher": model.publisher,
                "published_at": model.published_at.isoformat(),
                "ingested_at": model.ingested_at.isoformat() if model.ingested_at else datetime.now(UTC).isoformat(),
                "language": model.language,
                "jurisdiction": model.jurisdiction,
                "entities": model.entities,
                "tags": model.tags,
                "hash": model.hash,
                "confidence": model.confidence,
            }
            await client.publish(settings.sse_channel, json.dumps(payload))

        try:
            await session.execute(text("REFRESH MATERIALIZED VIEW hourly_stats;"))
            await session.execute(text("REFRESH MATERIALIZED VIEW weekly_stats;"))
            await session.commit()
        except Exception:
            await session.rollback()

    health_payload: dict[str, Any] = {"updated_at": datetime.now(UTC).isoformat(), "sources": source_health}
    for entry in health_payload["sources"]:
        src = str(entry.get("source", ""))
        entry["inserted"] = inserted_by_source.get(src, 0)
        entry["duplicates"] = duplicates_by_source.get(src, 0)
        entry["write_errors"] = write_errors_by_source.get(src, 0)
    await _set_source_health(client, health_payload)

    await engine.dispose()
    await client.close()
    return inserted


@shared_task(name="workers.app.tasks.ingest_live_developments")
def ingest_live_developments() -> int:
    return asyncio.run(_insert_and_publish())


# Backward-compatible alias for existing beat/task references.
@shared_task(name="workers.app.tasks.ingest_mock_developments")
def ingest_mock_developments() -> int:
    return ingest_live_developments()


async def _run_backfill(
    *,
    start_date: date_type,
    end_date: date_type,
    per_page: int,
    max_pages_per_month: int,
) -> dict[str, object]:
    inserted = 0
    scanned = 0
    started_at = datetime.now(UTC).isoformat()
    client = redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    await _set_backfill_status(
        client,
        {
            "state": "running",
            "started_at": started_at,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "scanned": scanned,
            "inserted": inserted,
        },
    )

    try:
        windows = month_windows(start_date, end_date)
        async with SessionLocal() as session:
            for month_start, month_end in windows:
                month_records = await fetch_openalex_month(
                    start_date=month_start,
                    end_date=month_end,
                    per_page=per_page,
                    max_pages=max_pages_per_month,
                )

                for record_data in month_records:
                    scanned += 1
                    if not _is_canada_relevant(
                        record_data,
                        min_confidence=BACKFILL_MIN_CONFIDENCE,
                        min_relevance=BACKFILL_MIN_CANADA_RELEVANCE,
                    ):
                        continue
                    record_data.pop("relevance_score", None)
                    model = AIDevelopment(**record_data)
                    session.add(model)
                    try:
                        await session.commit()
                    except IntegrityError:
                        await session.rollback()
                        continue

                    inserted += 1
                    payload = {
                        "id": str(model.id),
                        "source_id": model.source_id,
                        "source_type": _enum_or_str(model.source_type),
                        "category": _enum_or_str(model.category),
                        "title": model.title,
                        "url": model.url,
                        "publisher": model.publisher,
                        "published_at": model.published_at.isoformat(),
                        "ingested_at": model.ingested_at.isoformat() if model.ingested_at else datetime.now(UTC).isoformat(),
                        "language": model.language,
                        "jurisdiction": model.jurisdiction,
                        "entities": model.entities,
                        "tags": model.tags,
                        "hash": model.hash,
                        "confidence": model.confidence,
                    }
                    await client.publish(settings.sse_channel, json.dumps(payload))

                await _set_backfill_status(
                    client,
                    {
                        "state": "running",
                        "started_at": started_at,
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "current_month": month_start.isoformat(),
                        "scanned": scanned,
                        "inserted": inserted,
                    },
                )

            try:
                await session.execute(text("REFRESH MATERIALIZED VIEW hourly_stats;"))
                await session.execute(text("REFRESH MATERIALIZED VIEW weekly_stats;"))
                await session.commit()
            except Exception:
                await session.rollback()

        finished_payload = {
            "state": "completed",
            "started_at": started_at,
            "finished_at": datetime.now(UTC).isoformat(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "scanned": scanned,
            "inserted": inserted,
        }
        await _set_backfill_status(client, finished_payload)
        return finished_payload
    except Exception as exc:
        failed_payload = {
            "state": "failed",
            "started_at": started_at,
            "failed_at": datetime.now(UTC).isoformat(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "scanned": scanned,
            "inserted": inserted,
            "error": str(exc),
        }
        await _set_backfill_status(client, failed_payload)
        raise
    finally:
        await engine.dispose()
        await client.close()


@shared_task(name="workers.app.tasks.backfill_openalex_history")
def backfill_openalex_history(
    start_date: str = "2022-11-01",
    end_date: str | None = None,
    per_page: int = 50,
    max_pages_per_month: int = 3,
) -> dict[str, object]:
    start = datetime.fromisoformat(start_date).date()
    end = datetime.now(UTC).date() if not end_date else datetime.fromisoformat(end_date).date()
    return asyncio.run(
        _run_backfill(
            start_date=start,
            end_date=end,
            per_page=max(10, min(per_page, 200)),
            max_pages_per_month=max(1, min(max_pages_per_month, 10)),
        )
    )
