import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from backend.app.db.base import Base
from backend.app.models.ai_development import AIDevelopment, CategoryType, SourceType
from backend.app.services.feed import parse_time_window
from backend.app.services.stats import fetch_alerts

FIXED_NOW = datetime(2026, 2, 17, 12, 0, tzinfo=UTC)


class FixedDatetime:
    @classmethod
    def now(cls, tz=None):
        if tz:
            return FIXED_NOW
        return FIXED_NOW.replace(tzinfo=None)


@pytest.fixture
async def async_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture(autouse=True)
def freeze_time(monkeypatch):
    monkeypatch.setattr("backend.app.services.stats.datetime", FixedDatetime)


async def _persist_counts(
    session: AsyncSession,
    category: CategoryType,
    counts: list[int],
    current_count: int,
    window: timedelta,
) -> None:
    current_start = FIXED_NOW - window
    lookback_windows = len(counts)
    for index, count in enumerate(counts, start=1):
        window_index = lookback_windows - index + 1
        history_start = current_start - (window * window_index)
        midpoint = history_start + window / 2
        for idx in range(count):
            session.add(
                AIDevelopment(
                    source_id=f"{category}-{window_index}-{idx}",
                    source_type=SourceType.media,
                    category=category,
                    title="test",
                    url="https://example.com",
                    publisher="pytest",
                    published_at=midpoint,
                    ingested_at=midpoint,
                    language="en",
                    jurisdiction="Canada",
                    entities=[],
                    tags=[],
                    hash=str(uuid.uuid4()),
                    confidence=0.5,
                )
            )
    midpoint = current_start + window / 2
    for idx in range(current_count):
        session.add(
            AIDevelopment(
                source_id=f"{category}-current-{idx}",
                source_type=SourceType.media,
                category=category,
                title="current",
                url="https://example.com/current",
                publisher="pytest",
                published_at=midpoint,
                ingested_at=midpoint,
                language="en",
                jurisdiction="Canada",
                entities=[],
                tags=[],
                hash=str(uuid.uuid4()),
                confidence=0.9,
            )
        )
    await session.commit()


async def _run_for_category(
    session: AsyncSession,
    *,  # expedite keyword-only improves readability
    time_window: str,
    counts: list[int],
    current_value: int,
    **kwargs,
):
    window = parse_time_window(time_window)
    await _persist_counts(session, CategoryType.policy, counts, current_value, window)
    return await fetch_alerts(session, time_window=time_window, **kwargs)


@pytest.mark.asyncio
async def test_fetch_alerts_delta_only(async_session: AsyncSession):
    response = await _run_for_category(
        async_session,
        time_window="1h",
        counts=[10] * 8,
        current_value=0,
        min_baseline=3,
        min_delta_percent=35,
        min_z_score=999,
    )
    assert response.min_z_score == 999
    assert response.lookback_windows == 8
    assert len(response.alerts) == 1
    alert = response.alerts[0]
    assert alert.trigger_reason == "delta"
    assert alert.direction == "down"


@pytest.mark.asyncio
async def test_fetch_alerts_zscore_only(async_session: AsyncSession):
    response = await _run_for_category(
        async_session,
        time_window="1h",
        counts=[10] * 8,
        current_value=30,
        min_baseline=3,
        min_delta_percent=999,
        min_z_score=1.5,
    )
    assert response.min_delta_percent == 999
    assert response.min_z_score == 1.5
    assert len(response.alerts) == 1
    alert = response.alerts[0]
    assert alert.trigger_reason == "z_score"
    assert alert.direction == "up"
    assert alert.z_score is not None


@pytest.mark.asyncio
async def test_fetch_alerts_hybrid_trigger(async_session: AsyncSession):
    response = await _run_for_category(
        async_session,
        time_window="1h",
        counts=[10] * 8,
        current_value=25,
        min_baseline=3,
    )
    assert response.min_z_score == 1.2
    assert response.lookback_windows == 8
    assert len(response.alerts) == 1
    alert = response.alerts[0]
    assert alert.trigger_reason == "hybrid"
    assert alert.z_score is not None
    assert alert.delta_percent != 0
