import asyncio
import hashlib
import json
import random
import uuid
from datetime import UTC, datetime, timedelta

import redis.asyncio as redis
from celery import shared_task
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.models.ai_development import AIDevelopment, CategoryType, SourceType
from workers.app.source_adapters import fetch_canada_gov_metadata, fetch_openalex_metadata

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


def _fingerprint(source_id: str, url: str, published_at: datetime) -> str:
    material = f"{source_id}|{url}|{published_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _generate_item() -> dict[str, object]:
    publisher, source_type, default_category, jurisdiction = random.choice(PUBLISHERS)
    title = random.choice(TITLE_STEMS)
    if source_type == SourceType.funding:
        category = CategoryType.funding
    else:
        category = default_category

    published_at = datetime.now(UTC) - timedelta(minutes=random.randint(0, 240))
    source_id = f"{publisher.lower().replace(' ', '-')}-{uuid.uuid4().hex[:12]}"
    language = random.choice(["en", "fr", "en"])
    url = f"https://example.com/{source_id}"
    entities = random.choice(ENTITIES)
    tags = random.sample(TAG_BANK, k=random.randint(2, 4))
    confidence = round(random.uniform(0.68, 0.98), 2)

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
    }


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

    return items


async def _insert_and_publish() -> int:
    inserted = 0
    client = redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    candidates = await _load_candidate_items()

    async with SessionLocal() as session:
        for record_data in candidates:
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
                "source_type": model.source_type.value,
                "category": model.category.value,
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
