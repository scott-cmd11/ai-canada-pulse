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
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.app.core.config import settings
from backend.app.models.ai_development import AIDevelopment, CategoryType, SourceType
from backend.app.models.source_tracking import SourceIngestRun, SourceIngestState
from workers.app.backfill import fetch_openalex_month, month_windows
from workers.app.source_adapters import (
    fetch_amii_news_metadata,
    fetch_arxiv_ai_canada_metadata,
    fetch_betakit_ai_metadata,
    fetch_canada_gazette_ai_metadata,
    fetch_canada_gov_metadata,
    fetch_cfi_ai_metadata,
    fetch_cifar_ai_metadata,
    fetch_cihr_ai_metadata,
    fetch_crossref_ai_canada_metadata,
    fetch_crtc_canada_metadata,
    fetch_github_ai_canada_metadata,
    fetch_google_news_canada_ai_metadata,
    fetch_mila_news_metadata,
    fetch_nserc_ai_metadata,
    fetch_openalex_metadata,
    fetch_opc_canada_metadata,
    fetch_treasury_board_canada_metadata,
    fetch_vector_news_metadata,
)
from workers.app.source_registry import SourceDefinition, get_source_definition, list_source_definitions

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
INGEST_LOCK_KEY_PREFIX = "ingest_live:lock"
INGEST_LOCK_TTL_SECONDS = 600

SourceFetcher = Callable[[], Awaitable[list[dict[str, object]]]]
SOURCE_FETCHERS: dict[str, SourceFetcher] = {
    "openalex": lambda: fetch_openalex_metadata(limit=6),
    "canada_gov_ised": lambda: fetch_canada_gov_metadata(limit=6),
    "betakit_ai": lambda: fetch_betakit_ai_metadata(limit=8),
    "google_news_canada_ai": lambda: fetch_google_news_canada_ai_metadata(limit=10),
    "github_ai_canada": lambda: fetch_github_ai_canada_metadata(limit=10),
    "arxiv_ai_canada": lambda: fetch_arxiv_ai_canada_metadata(limit=8),
    "treasury_board_canada": lambda: fetch_treasury_board_canada_metadata(limit=6),
    "opc_canada": lambda: fetch_opc_canada_metadata(limit=6),
    "crtc_canada": lambda: fetch_crtc_canada_metadata(limit=8),
    "canada_gazette_ai": lambda: fetch_canada_gazette_ai_metadata(limit=8),
    "mila_news": lambda: fetch_mila_news_metadata(limit=8),
    "vector_news": lambda: fetch_vector_news_metadata(limit=8),
    "amii_news": lambda: fetch_amii_news_metadata(limit=8),
    "cifar_ai": lambda: fetch_cifar_ai_metadata(limit=8),
    "nserc_ai": lambda: fetch_nserc_ai_metadata(limit=10),
    "cihr_ai": lambda: fetch_cihr_ai_metadata(limit=10),
    "cfi_ai": lambda: fetch_cfi_ai_metadata(limit=10),
    "crossref_ai_canada": lambda: fetch_crossref_ai_canada_metadata(limit=10),
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


async def _set_source_health(client: redis.Redis, payload: dict[str, object]) -> None:
    await client.set(SOURCE_HEALTH_KEY, json.dumps(payload))


def _source_lock_key(source_key: str) -> str:
    return f"{INGEST_LOCK_KEY_PREFIX}:{source_key}"


async def _upsert_source_state(
    session,
    *,
    source_key: str,
) -> SourceIngestState:
    state = await session.get(SourceIngestState, source_key)
    if state is None:
        state = SourceIngestState(
            source_key=source_key,
            next_run_at=datetime.now(UTC),
            consecutive_failures=0,
        )
        session.add(state)
        await session.flush()
    return state


async def _merge_source_health_entry(client: redis.Redis, entry: dict[str, object]) -> None:
    payload: dict[str, Any] = {}
    raw = await client.get(SOURCE_HEALTH_KEY)
    if raw:
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {}

    sources_by_key: dict[str, dict[str, object]] = {}
    for current in payload.get("sources", []):
        if isinstance(current, dict) and current.get("source"):
            sources_by_key[str(current["source"])] = current

    source_key = str(entry.get("source", ""))
    if source_key:
        sources_by_key[source_key] = entry

    merged_sources = sorted(sources_by_key.values(), key=lambda value: str(value.get("source", "")))
    skipped_lock_count = int(payload.get("skipped_lock_count", 0))
    if entry.get("status") == "skipped_lock":
        skipped_lock_count += 1

    merged_payload = {
        "updated_at": datetime.now(UTC).isoformat(),
        "run_status": "ok" if str(entry.get("status", "ok")) == "ok" else str(entry.get("status", "error")),
        "sources": merged_sources,
        "inserted_total": sum(int(source.get("inserted", 0)) for source in merged_sources),
        "candidates_total": sum(int(source.get("accepted", 0)) for source in merged_sources),
        "skipped_lock_count": skipped_lock_count,
    }
    await _set_source_health(client, merged_payload)


async def _publish_item(client: redis.Redis, model: AIDevelopment) -> None:
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


async def _run_source_ingest(
    *,
    source: SourceDefinition,
    fetcher: SourceFetcher,
    SessionLocal,
    client: redis.Redis,
) -> dict[str, object]:
    started_at = datetime.now(UTC)
    started = perf_counter()
    fetched = 0
    accepted = 0
    inserted = 0
    duplicates = 0
    write_errors = 0
    status = "ok"
    error = ""

    lock_token = uuid.uuid4().hex
    lock_ttl = max(INGEST_LOCK_TTL_SECONDS, source.cadence_minutes * 120)
    lock_key = _source_lock_key(source.key)
    lock_acquired = bool(await client.set(lock_key, lock_token, nx=True, ex=lock_ttl))

    if not lock_acquired:
        finished_at = datetime.now(UTC)
        duration_ms = int((perf_counter() - started) * 1000)
        async with SessionLocal() as session:
            state = await _upsert_source_state(session, source_key=source.key)
            state.next_run_at = finished_at + timedelta(minutes=1)
            state.updated_at = finished_at
            session.add(
                SourceIngestRun(
                    source_key=source.key,
                    status="skipped_lock",
                    started_at=started_at,
                    finished_at=finished_at,
                    duration_ms=duration_ms,
                    fetched=0,
                    accepted=0,
                    inserted=0,
                    duplicates=0,
                    write_errors=0,
                    error="",
                    details={
                        "display_name": source.display_name,
                        "cadence_minutes": source.cadence_minutes,
                        "acquisition_mode": source.acquisition_mode,
                    },
                )
            )
            await session.commit()

        return {
            "source": source.key,
            "display_name": source.display_name,
            "status": "skipped_lock",
            "fetched": 0,
            "accepted": 0,
            "inserted": 0,
            "duplicates": 0,
            "write_errors": 0,
            "duration_ms": duration_ms,
            "last_run": finished_at.isoformat(),
            "error": "",
            "cadence_minutes": source.cadence_minutes,
            "acquisition_mode": source.acquisition_mode,
            "source_type": source.source_type,
            "enabled": source.enabled,
            "freshness_lag_minutes": None,
            "consecutive_failures": None,
            "next_run_at": (finished_at + timedelta(minutes=1)).isoformat(),
            "last_success_at": None,
            "last_error_at": None,
        }

    try:
        async with SessionLocal() as session:
            state = await _upsert_source_state(session, source_key=source.key)
            try:
                source_items = await fetcher()
                fetched = len(source_items)
                filtered = [item for item in source_items if _is_canada_relevant(item)]
                accepted = len(filtered)

                for record_data in filtered:
                    normalized_data = dict(record_data)
                    normalized_data.pop("relevance_score", None)
                    model = AIDevelopment(**normalized_data)
                    session.add(model)
                    try:
                        await session.commit()
                    except IntegrityError:
                        await session.rollback()
                        duplicates += 1
                        continue
                    except Exception:
                        await session.rollback()
                        write_errors += 1
                        continue

                    inserted += 1
                    await _publish_item(client, model)

                if inserted > 0:
                    try:
                        await session.execute(text("REFRESH MATERIALIZED VIEW hourly_stats;"))
                        await session.execute(text("REFRESH MATERIALIZED VIEW weekly_stats;"))
                        await session.commit()
                    except Exception:
                        await session.rollback()

                finished_at = datetime.now(UTC)
                state.last_success_at = finished_at
                state.last_error_at = None
                state.last_error = None
                state.consecutive_failures = 0
                state.next_run_at = finished_at + timedelta(minutes=source.cadence_minutes)
            except Exception as exc:
                status = "error"
                error = str(exc)
                finished_at = datetime.now(UTC)
                state.last_error_at = finished_at
                state.last_error = error[:2000]
                state.consecutive_failures = int(state.consecutive_failures) + 1
                backoff_multiplier = min(8, 2 ** min(int(state.consecutive_failures), 4))
                state.next_run_at = finished_at + timedelta(minutes=min(360, source.cadence_minutes * backoff_multiplier))

            duration_ms = int((perf_counter() - started) * 1000)
            state.updated_at = finished_at
            session.add(
                SourceIngestRun(
                    source_key=source.key,
                    status=status,
                    started_at=started_at,
                    finished_at=finished_at,
                    duration_ms=duration_ms,
                    fetched=fetched,
                    accepted=accepted,
                    inserted=inserted,
                    duplicates=duplicates,
                    write_errors=write_errors,
                    error=error,
                    details={
                        "display_name": source.display_name,
                        "cadence_minutes": source.cadence_minutes,
                        "acquisition_mode": source.acquisition_mode,
                    },
                )
            )
            await session.commit()

            freshness_lag_minutes = None
            if state.last_success_at is not None:
                freshness_lag_minutes = max(0, int((finished_at - state.last_success_at).total_seconds() // 60))

            return {
                "source": source.key,
                "display_name": source.display_name,
                "status": status,
                "fetched": fetched,
                "accepted": accepted,
                "inserted": inserted,
                "duplicates": duplicates,
                "write_errors": write_errors,
                "duration_ms": duration_ms,
                "last_run": finished_at.isoformat(),
                "error": error,
                "cadence_minutes": source.cadence_minutes,
                "acquisition_mode": source.acquisition_mode,
                "source_type": source.source_type,
                "enabled": source.enabled,
                "freshness_lag_minutes": freshness_lag_minutes,
                "consecutive_failures": int(state.consecutive_failures),
                "next_run_at": state.next_run_at.isoformat() if state.next_run_at else None,
                "last_success_at": state.last_success_at.isoformat() if state.last_success_at else None,
                "last_error_at": state.last_error_at.isoformat() if state.last_error_at else None,
            }
    finally:
        try:
            if await client.get(lock_key) == lock_token:
                await client.delete(lock_key)
        except Exception:
            pass


async def _insert_and_publish(source_keys: list[str] | None = None) -> int:
    inserted_total = 0
    client = redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    if source_keys is None:
        selected_sources = list_source_definitions(include_disabled=False)
    else:
        selected_sources = [
            source
            for source_key in source_keys
            for source in [get_source_definition(source_key)]
            if source is not None
        ]

    try:
        ran_any = False
        for source in selected_sources:
            fetcher = SOURCE_FETCHERS.get(source.key)
            if fetcher is None:
                continue
            ran_any = True
            health_entry = await _run_source_ingest(
                source=source,
                fetcher=fetcher,
                SessionLocal=SessionLocal,
                client=client,
            )
            inserted_total += int(health_entry.get("inserted", 0))
            await _merge_source_health_entry(client, health_entry)

        if not ran_any and settings.enable_synthetic_fallback:
            async with SessionLocal() as session:
                model = AIDevelopment(**{k: v for k, v in _generate_item().items() if k != "relevance_score"})
                session.add(model)
                try:
                    await session.commit()
                    inserted_total += 1
                    await _publish_item(client, model)
                except Exception:
                    await session.rollback()
    finally:
        await engine.dispose()
        await client.close()

    return inserted_total


@shared_task(name="workers.app.tasks.ingest_source_developments")
def ingest_source_developments(source_key: str) -> int:
    return asyncio.run(_insert_and_publish(source_keys=[source_key]))


@shared_task(name="workers.app.tasks.ingest_live_developments")
def ingest_live_developments() -> int:
    source_keys = [source.key for source in list_source_definitions(include_disabled=False)]
    return asyncio.run(_insert_and_publish(source_keys=source_keys))


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



