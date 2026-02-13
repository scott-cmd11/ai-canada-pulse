import asyncio
import hashlib
import json
import random
import uuid
from datetime import UTC, datetime, timedelta
from datetime import date as date_type

import redis.asyncio as redis
from celery import shared_task
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.models.ai_development import AIDevelopment, CategoryType, SourceType
from workers.app.source_adapters import fetch_canada_gov_metadata, fetch_openalex_metadata
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


def _enum_or_str(value: object) -> str:
    if hasattr(value, "value"):
        return str(getattr(value, "value"))
    return str(value)


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


async def _load_candidate_items() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    try:
        items.extend(await fetch_openalex_metadata(limit=3))
    except Exception:
        pass

    try:
        items.extend(await fetch_canada_gov_metadata(limit=3))
    except Exception:
        pass

    if not items:
        items = [_generate_item() for _ in range(random.randint(1, 3))]

    filtered = [item for item in items if _is_canada_relevant(item)]
    if not filtered:
        filtered = [_generate_item() for _ in range(random.randint(1, 2))]
    return filtered


async def _insert_and_publish() -> int:
    inserted = 0
    client = redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    candidates = await _load_candidate_items()

    async with SessionLocal() as session:
        for record_data in candidates:
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

        try:
            await session.execute(text("REFRESH MATERIALIZED VIEW hourly_stats;"))
            await session.execute(text("REFRESH MATERIALIZED VIEW weekly_stats;"))
            await session.commit()
        except Exception:
            await session.rollback()

    await engine.dispose()
    await client.close()
    return inserted


@shared_task(name="workers.app.tasks.ingest_mock_developments")
def ingest_mock_developments() -> int:
    return asyncio.run(_insert_and_publish())


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
