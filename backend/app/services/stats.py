from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.ai_development import AIDevelopment, CategoryType
from backend.app.schemas.ai_development import (
    EChartsSeries,
    EChartsTimeseriesResponse,
    KPIsResponse,
    KPIWindow,
    StatsAlertItem,
    StatsAlertsResponse,
)


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


async def fetch_jurisdictions_breakdown(db: AsyncSession, *, time_window: str = "7d", limit: int = 12) -> dict[str, object]:
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

    jurisdictions_stmt = (
        select(AIDevelopment.jurisdiction, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.jurisdiction)
        .order_by(text("count DESC"))
        .limit(max(1, min(limit, 25)))
    )
    rows = (await db.execute(jurisdictions_stmt)).all()
    return {
        "time_window": time_window,
        "total": total,
        "jurisdictions": [{"name": str(name), "count": int(count)} for name, count in rows],
    }


async def fetch_entities_breakdown(db: AsyncSession, *, time_window: str = "7d", limit: int = 12) -> dict[str, object]:
    now = datetime.now(UTC)
    since = now - (
        {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }.get(time_window, timedelta(days=7))
    )
    bounded_limit = max(1, min(limit, 30))
    total_stmt = select(func.count(AIDevelopment.id)).where(AIDevelopment.published_at >= since)
    total = int((await db.execute(total_stmt)).scalar_one())

    rows = (
        await db.execute(
            text(
                """
                SELECT entity_name AS name, COUNT(*)::int AS count
                FROM ai_developments,
                LATERAL jsonb_array_elements_text(COALESCE(entities, '[]'::jsonb)) AS entity_name
                WHERE published_at >= :since
                  AND entity_name <> ''
                GROUP BY entity_name
                ORDER BY count DESC
                LIMIT :limit
                """
            ),
            {"since": since, "limit": bounded_limit},
        )
    ).all()

    return {
        "time_window": time_window,
        "total": total,
        "entities": [{"name": str(name), "count": int(count)} for name, count in rows],
    }


async def fetch_tags_breakdown(db: AsyncSession, *, time_window: str = "7d", limit: int = 14) -> dict[str, object]:
    now = datetime.now(UTC)
    since = now - (
        {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }.get(time_window, timedelta(days=7))
    )
    bounded_limit = max(1, min(limit, 30))
    total_stmt = select(func.count(AIDevelopment.id)).where(AIDevelopment.published_at >= since)
    total = int((await db.execute(total_stmt)).scalar_one())

    rows = (
        await db.execute(
            text(
                """
                SELECT tag_name AS name, COUNT(*)::int AS count
                FROM ai_developments,
                LATERAL unnest(COALESCE(tags, ARRAY[]::text[])) AS tag_name
                WHERE published_at >= :since
                  AND tag_name <> ''
                GROUP BY tag_name
                ORDER BY count DESC
                LIMIT :limit
                """
            ),
            {"since": since, "limit": bounded_limit},
        )
    ).all()

    return {
        "time_window": time_window,
        "total": total,
        "tags": [{"name": str(name), "count": int(count)} for name, count in rows],
    }


async def fetch_brief_snapshot(db: AsyncSession, *, time_window: str = "24h") -> dict[str, object]:
    now = datetime.now(UTC)
    since = now - (
        {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }.get(time_window, timedelta(hours=24))
    )

    total_stmt = select(func.count(AIDevelopment.id)).where(AIDevelopment.published_at >= since)
    total = int((await db.execute(total_stmt)).scalar_one())

    top_category_stmt = (
        select(AIDevelopment.category, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.category)
        .order_by(text("count DESC"))
        .limit(1)
    )
    top_jurisdiction_stmt = (
        select(AIDevelopment.jurisdiction, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.jurisdiction)
        .order_by(text("count DESC"))
        .limit(1)
    )
    top_publisher_stmt = (
        select(AIDevelopment.publisher, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.publisher)
        .order_by(text("count DESC"))
        .limit(1)
    )
    top_tag_stmt = text(
        """
        SELECT tag_name AS name, COUNT(*)::int AS count
        FROM ai_developments,
        LATERAL unnest(COALESCE(tags, ARRAY[]::text[])) AS tag_name
        WHERE published_at >= :since
          AND tag_name <> ''
        GROUP BY tag_name
        ORDER BY count DESC
        LIMIT 1
        """
    )

    category_row = (await db.execute(top_category_stmt)).first()
    jurisdiction_row = (await db.execute(top_jurisdiction_stmt)).first()
    publisher_row = (await db.execute(top_publisher_stmt)).first()
    tag_row = (await db.execute(top_tag_stmt, {"since": since})).first()
    alerts = await fetch_alerts(db, time_window=time_window, min_baseline=3, min_delta_percent=35.0)

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "total_items": total,
        "high_alert_count": len([a for a in alerts.alerts if a.severity == "high"]),
        "top_category": {
            "name": _enum_name(category_row[0]) if category_row else "",
            "count": int(category_row[1]) if category_row else 0,
        },
        "top_jurisdiction": {
            "name": str(jurisdiction_row[0]) if jurisdiction_row else "",
            "count": int(jurisdiction_row[1]) if jurisdiction_row else 0,
        },
        "top_publisher": {
            "name": str(publisher_row[0]) if publisher_row else "",
            "count": int(publisher_row[1]) if publisher_row else 0,
        },
        "top_tag": {
            "name": str(tag_row[0]) if tag_row else "",
            "count": int(tag_row[1]) if tag_row else 0,
        },
    }


async def fetch_alerts(
    db: AsyncSession,
    *,
    time_window: str = "24h",
    min_baseline: int = 3,
    min_delta_percent: float = 35.0,
) -> StatsAlertsResponse:
    now = datetime.now(UTC)
    window = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }.get(time_window, timedelta(hours=24))
    current_start = now - window
    previous_start = now - (window * 2)

    current_stmt = (
        select(AIDevelopment.category, func.count(AIDevelopment.id))
        .where(and_(AIDevelopment.published_at >= current_start, AIDevelopment.published_at < now))
        .group_by(AIDevelopment.category)
    )
    previous_stmt = (
        select(AIDevelopment.category, func.count(AIDevelopment.id))
        .where(and_(AIDevelopment.published_at >= previous_start, AIDevelopment.published_at < current_start))
        .group_by(AIDevelopment.category)
    )

    current_rows = (await db.execute(current_stmt)).all()
    previous_rows = (await db.execute(previous_stmt)).all()
    current_map = {_enum_name(category): int(count) for category, count in current_rows}
    previous_map = {_enum_name(category): int(count) for category, count in previous_rows}

    categories = [c.value for c in CategoryType]
    alerts: list[StatsAlertItem] = []
    for category in categories:
        current = current_map.get(category, 0)
        previous = previous_map.get(category, 0)
        baseline = max(previous, min_baseline)
        delta = _calc_delta(current, previous)
        if baseline < min_baseline and current < min_baseline:
            continue
        if abs(delta) < min_delta_percent:
            continue

        direction = "up" if delta >= 0 else "down"
        severity = "high" if abs(delta) >= 100 else "medium"
        alerts.append(
            StatsAlertItem(
                category=category,
                direction=direction,
                severity=severity,
                current=current,
                previous=previous,
                delta_percent=delta,
            )
        )

    alerts.sort(key=lambda item: abs(item.delta_percent), reverse=True)
    return StatsAlertsResponse(
        generated_at=now,
        time_window=time_window,
        min_baseline=min_baseline,
        min_delta_percent=min_delta_percent,
        alerts=alerts[:8],
    )
