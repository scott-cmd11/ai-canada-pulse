from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.ai_development import AIDevelopment, CategoryType
from backend.app.schemas.ai_development import EChartsSeries, EChartsTimeseriesResponse, KPIsResponse, KPIWindow


def _calc_delta(current: int, previous: int) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100.0, 2)


def _enum_name(value: object) -> str:
    if hasattr(value, "value"):
        return str(getattr(value, "value"))
    return str(value)


async def _count_between(db: AsyncSession, start: datetime, end: datetime) -> int:
    stmt = select(func.count(AIDevelopment.id)).where(
        and_(AIDevelopment.published_at >= start, AIDevelopment.published_at < end)
    )
    return int((await db.execute(stmt)).scalar_one())


async def fetch_kpis(db: AsyncSession) -> KPIsResponse:
    now = datetime.now(UTC)
    windows = {
        "m15": timedelta(minutes=15),
        "h1": timedelta(hours=1),
        "d7": timedelta(days=7),
    }

    payload: dict[str, KPIWindow] = {}
    for key, delta in windows.items():
        current_start = now - delta
        previous_start = now - (delta * 2)
        current = await _count_between(db, current_start, now)
        previous = await _count_between(db, previous_start, current_start)
        payload[key] = KPIWindow(
            current=current,
            previous=previous,
            delta_percent=_calc_delta(current, previous),
        )

    return KPIsResponse(**payload)


async def fetch_hourly_timeseries(db: AsyncSession) -> EChartsTimeseriesResponse:
    now = datetime.now(UTC)
    since = now - timedelta(hours=24)
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW hourly_stats;"))
        rows = (
            await db.execute(
                text(
                    """
                    SELECT bucket, category, SUM(item_count) AS item_count
                    FROM hourly_stats
                    GROUP BY bucket, category
                    ORDER BY bucket
                    """
                )
            )
        ).all()
    except Exception:
        hour_bucket = func.date_trunc("hour", AIDevelopment.published_at)
        stmt = (
            select(hour_bucket.label("bucket"), AIDevelopment.category, func.count(AIDevelopment.id))
            .where(AIDevelopment.published_at >= since)
            .group_by("bucket", AIDevelopment.category)
            .order_by("bucket")
        )
        rows = (await db.execute(stmt)).all()

    buckets = [since.replace(minute=0, second=0, microsecond=0) + timedelta(hours=i) for i in range(24)]
    labels = [bucket.strftime("%H:%M") for bucket in buckets]
    categories = [c.value for c in CategoryType]
    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for bucket, category, count in rows:
        label = bucket.astimezone(UTC).strftime("%H:%M")
        matrix[str(category)][label] = int(count)

    series = [
        EChartsSeries(
            name=cat,
            type="line",
            stack="total",
            areaStyle={},
            emphasis={"focus": "series"},
            data=[matrix[cat].get(label, 0) for label in labels],
        )
        for cat in categories
    ]

    return EChartsTimeseriesResponse(legend=categories, xAxis=labels, series=series)


async def fetch_weekly_timeseries(db: AsyncSession) -> EChartsTimeseriesResponse:
    now = datetime.now(UTC)
    since = now - timedelta(weeks=12)
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW weekly_stats;"))
        rows = (
            await db.execute(
                text(
                    """
                    SELECT bucket, category, item_count
                    FROM weekly_stats
                    ORDER BY bucket
                    """
                )
            )
        ).all()
    except Exception:
        week_bucket = func.date_trunc("week", AIDevelopment.published_at)
        stmt = (
            select(week_bucket.label("bucket"), AIDevelopment.category, func.count(AIDevelopment.id))
            .where(AIDevelopment.published_at >= since)
            .group_by("bucket", AIDevelopment.category)
            .order_by("bucket")
        )
        rows = (await db.execute(stmt)).all()

    start_week = since - timedelta(days=since.weekday())
    buckets = [start_week.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(weeks=i) for i in range(12)]
    labels = [bucket.strftime("%Y-%m-%d") for bucket in buckets]
    categories = [c.value for c in CategoryType]
    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for bucket, category, count in rows:
        label = bucket.astimezone(UTC).strftime("%Y-%m-%d")
        matrix[str(category)][label] = int(count)

    series = [
        EChartsSeries(
            name=cat,
            type="bar",
            stack="total",
            emphasis={"focus": "series"},
            data=[matrix[cat].get(label, 0) for label in labels],
        )
        for cat in categories
    ]

    return EChartsTimeseriesResponse(legend=categories, xAxis=labels, series=series)


async def fetch_sources_breakdown(db: AsyncSession, *, time_window: str = "7d", limit: int = 8) -> dict[str, object]:
    now = datetime.now(UTC)
    since = now - (
        {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }.get(time_window, timedelta(days=7))
    )

    total_stmt = select(func.count(AIDevelopment.id)).where(AIDevelopment.published_at >= since)
    total = int((await db.execute(total_stmt)).scalar_one())

    by_publisher_stmt = (
        select(AIDevelopment.publisher, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.publisher)
        .order_by(text("count DESC"))
        .limit(max(1, min(limit, 20)))
    )
    by_type_stmt = (
        select(AIDevelopment.source_type, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.source_type)
        .order_by(text("count DESC"))
    )

    publishers_rows = (await db.execute(by_publisher_stmt)).all()
    types_rows = (await db.execute(by_type_stmt)).all()
    return {
        "time_window": time_window,
        "total": total,
        "publishers": [{"name": str(name), "count": int(count)} for name, count in publishers_rows],
        "source_types": [{"name": _enum_name(name), "count": int(count)} for name, count in types_rows],
    }
