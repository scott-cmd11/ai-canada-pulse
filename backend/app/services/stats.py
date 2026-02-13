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


async def fetch_scope_compare(db: AsyncSession, *, time_window: str = "7d") -> dict[str, object]:
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

    scope_stmt = (
        select(AIDevelopment.jurisdiction, func.count(AIDevelopment.id).label("count"))
        .where(AIDevelopment.published_at >= since)
        .group_by(AIDevelopment.jurisdiction)
    )
    rows = (await db.execute(scope_stmt)).all()
    canada = sum(int(count) for jurisdiction, count in rows if str(jurisdiction).lower() == "canada")
    global_count = sum(int(count) for jurisdiction, count in rows if str(jurisdiction).lower() == "global")
    other = max(0, total - canada - global_count)

    category_rows = (
        await db.execute(
            select(AIDevelopment.category, AIDevelopment.jurisdiction, func.count(AIDevelopment.id).label("count"))
            .where(AIDevelopment.published_at >= since)
            .group_by(AIDevelopment.category, AIDevelopment.jurisdiction)
        )
    ).all()

    by_category: dict[str, dict[str, int]] = defaultdict(lambda: {"canada": 0, "global": 0})
    for category, jurisdiction, count in category_rows:
        key = _enum_name(category)
        jurisdiction_key = str(jurisdiction).lower()
        if jurisdiction_key == "canada":
            by_category[key]["canada"] += int(count)
        elif jurisdiction_key == "global":
            by_category[key]["global"] += int(count)

    categories = sorted(by_category.keys())
    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "total": total,
        "canada": canada,
        "global": global_count,
        "other": other,
        "categories": [
            {
                "name": name,
                "canada": by_category[name]["canada"],
                "global": by_category[name]["global"],
            }
            for name in categories
        ],
    }


async def fetch_confidence_profile(db: AsyncSession, *, time_window: str = "7d") -> dict[str, object]:
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
    avg_stmt = select(func.avg(AIDevelopment.confidence)).where(AIDevelopment.published_at >= since)
    total = int((await db.execute(total_stmt)).scalar_one())
    avg_conf = float((await db.execute(avg_stmt)).scalar_one() or 0.0)

    rows = (
        await db.execute(
            text(
                """
                SELECT
                  CASE
                    WHEN confidence >= 0.85 THEN 'very_high'
                    WHEN confidence >= 0.70 THEN 'high'
                    WHEN confidence >= 0.50 THEN 'medium'
                    ELSE 'low'
                  END AS bucket,
                  COUNT(*)::int AS count
                FROM ai_developments
                WHERE published_at >= :since
                GROUP BY bucket
                """
            ),
            {"since": since},
        )
    ).all()

    counts = {"very_high": 0, "high": 0, "medium": 0, "low": 0}
    for bucket, count in rows:
        counts[str(bucket)] = int(count)

    def pct(value: int) -> float:
        return round((value / max(1, total)) * 100.0, 2)

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "total": total,
        "average_confidence": round(avg_conf, 4),
        "buckets": [
            {"name": "very_high", "count": counts["very_high"], "percent": pct(counts["very_high"])},
            {"name": "high", "count": counts["high"], "percent": pct(counts["high"])},
            {"name": "medium", "count": counts["medium"], "percent": pct(counts["medium"])},
            {"name": "low", "count": counts["low"], "percent": pct(counts["low"])},
        ],
    }


def _hhi(values: list[int]) -> float:
    total = sum(values)
    if total <= 0:
        return 0.0
    return round(sum(((v / total) ** 2) for v in values), 4)


def _concentration_label(hhi: float) -> str:
    if hhi >= 0.4:
        return "high"
    if hhi >= 0.2:
        return "medium"
    return "low"


async def fetch_concentration(db: AsyncSession, *, time_window: str = "7d") -> dict[str, object]:
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

    sources_rows = (
        await db.execute(
            select(AIDevelopment.publisher, func.count(AIDevelopment.id).label("count"))
            .where(AIDevelopment.published_at >= since)
            .group_by(AIDevelopment.publisher)
            .order_by(text("count DESC"))
            .limit(8)
        )
    ).all()
    jurisdictions_rows = (
        await db.execute(
            select(AIDevelopment.jurisdiction, func.count(AIDevelopment.id).label("count"))
            .where(AIDevelopment.published_at >= since)
            .group_by(AIDevelopment.jurisdiction)
            .order_by(text("count DESC"))
            .limit(8)
        )
    ).all()
    categories_rows = (
        await db.execute(
            select(AIDevelopment.category, func.count(AIDevelopment.id).label("count"))
            .where(AIDevelopment.published_at >= since)
            .group_by(AIDevelopment.category)
            .order_by(text("count DESC"))
        )
    ).all()

    source_values = [int(row[1]) for row in sources_rows]
    jurisdiction_values = [int(row[1]) for row in jurisdictions_rows]
    category_values = [int(row[1]) for row in categories_rows]
    source_hhi = _hhi(source_values)
    jurisdiction_hhi = _hhi(jurisdiction_values)
    category_hhi = _hhi(category_values)
    combined = round((source_hhi + jurisdiction_hhi + category_hhi) / 3.0, 4)

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "total": total,
        "source_hhi": source_hhi,
        "source_level": _concentration_label(source_hhi),
        "jurisdiction_hhi": jurisdiction_hhi,
        "jurisdiction_level": _concentration_label(jurisdiction_hhi),
        "category_hhi": category_hhi,
        "category_level": _concentration_label(category_hhi),
        "combined_hhi": combined,
        "combined_level": _concentration_label(combined),
        "top_sources": [{"name": str(name), "count": int(count)} for name, count in sources_rows[:3]],
        "top_jurisdictions": [{"name": str(name), "count": int(count)} for name, count in jurisdictions_rows[:3]],
    }


async def fetch_momentum(db: AsyncSession, *, time_window: str = "24h", limit: int = 8) -> dict[str, object]:
    now = datetime.now(UTC)
    window = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }.get(time_window, timedelta(hours=24))
    current_start = now - window
    previous_start = now - (window * 2)

    def _delta(current: int, previous: int) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100.0, 2)

    category_current_rows = (
        await db.execute(
            select(AIDevelopment.category, func.count(AIDevelopment.id).label("count"))
            .where(and_(AIDevelopment.published_at >= current_start, AIDevelopment.published_at < now))
            .group_by(AIDevelopment.category)
        )
    ).all()
    category_previous_rows = (
        await db.execute(
            select(AIDevelopment.category, func.count(AIDevelopment.id).label("count"))
            .where(and_(AIDevelopment.published_at >= previous_start, AIDevelopment.published_at < current_start))
            .group_by(AIDevelopment.category)
        )
    ).all()
    publisher_current_rows = (
        await db.execute(
            select(AIDevelopment.publisher, func.count(AIDevelopment.id).label("count"))
            .where(and_(AIDevelopment.published_at >= current_start, AIDevelopment.published_at < now))
            .group_by(AIDevelopment.publisher)
            .order_by(text("count DESC"))
            .limit(40)
        )
    ).all()
    publisher_previous_rows = (
        await db.execute(
            select(AIDevelopment.publisher, func.count(AIDevelopment.id).label("count"))
            .where(and_(AIDevelopment.published_at >= previous_start, AIDevelopment.published_at < current_start))
            .group_by(AIDevelopment.publisher)
            .order_by(text("count DESC"))
            .limit(40)
        )
    ).all()

    category_current = {_enum_name(name): int(count) for name, count in category_current_rows}
    category_previous = {_enum_name(name): int(count) for name, count in category_previous_rows}
    publisher_current = {str(name): int(count) for name, count in publisher_current_rows}
    publisher_previous = {str(name): int(count) for name, count in publisher_previous_rows}

    category_items: list[dict[str, object]] = []
    for name in sorted(set(category_current.keys()) | set(category_previous.keys())):
        current = category_current.get(name, 0)
        previous = category_previous.get(name, 0)
        change = current - previous
        category_items.append(
            {
                "name": name,
                "current": current,
                "previous": previous,
                "change": change,
                "delta_percent": _delta(current, previous),
            }
        )
    category_items.sort(key=lambda item: abs(int(item["change"])), reverse=True)

    publisher_items: list[dict[str, object]] = []
    for name in sorted(set(publisher_current.keys()) | set(publisher_previous.keys())):
        current = publisher_current.get(name, 0)
        previous = publisher_previous.get(name, 0)
        change = current - previous
        if current == 0 and previous == 0:
            continue
        publisher_items.append(
            {
                "name": name,
                "current": current,
                "previous": previous,
                "change": change,
                "delta_percent": _delta(current, previous),
            }
        )
    publisher_items.sort(key=lambda item: abs(int(item["change"])), reverse=True)

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "categories": category_items[: max(1, min(limit, 20))],
        "publishers": publisher_items[: max(1, min(limit, 20))],
    }


async def fetch_risk_index(db: AsyncSession, *, time_window: str = "24h") -> dict[str, object]:
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
    incidents_stmt = select(func.count(AIDevelopment.id)).where(
        and_(AIDevelopment.published_at >= since, AIDevelopment.category == CategoryType.incidents)
    )
    low_conf_stmt = select(func.count(AIDevelopment.id)).where(
        and_(AIDevelopment.published_at >= since, AIDevelopment.confidence < 0.5)
    )
    total = int((await db.execute(total_stmt)).scalar_one())
    incidents = int((await db.execute(incidents_stmt)).scalar_one())
    low_confidence = int((await db.execute(low_conf_stmt)).scalar_one())

    incidents_ratio = incidents / max(1, total)
    low_confidence_ratio = low_confidence / max(1, total)
    concentration = await fetch_concentration(db, time_window=time_window)
    alerts = await fetch_alerts(db, time_window=time_window, min_baseline=3, min_delta_percent=35.0)
    high_alert_count = len([item for item in alerts.alerts if item.severity == "high"])

    score = (
        incidents_ratio * 35.0
        + low_confidence_ratio * 25.0
        + float(concentration.get("combined_hhi", 0.0)) * 40.0
        + min(20.0, high_alert_count * 5.0)
    ) * 100.0 / 100.0
    score = max(0.0, min(100.0, round(score, 2)))

    level = "low"
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"

    reasons: list[str] = []
    if incidents_ratio >= 0.08:
        reasons.append("incident_ratio_elevated")
    if low_confidence_ratio >= 0.15:
        reasons.append("low_confidence_share_elevated")
    if float(concentration.get("combined_hhi", 0.0)) >= 0.4:
        reasons.append("signal_concentration_high")
    if high_alert_count >= 2:
        reasons.append("multiple_high_alerts")
    if len(reasons) == 0:
        reasons.append("stable_signal_profile")

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "score": score,
        "level": level,
        "total": total,
        "incidents": incidents,
        "low_confidence": low_confidence,
        "high_alert_count": high_alert_count,
        "incidents_ratio": round(incidents_ratio, 4),
        "low_confidence_ratio": round(low_confidence_ratio, 4),
        "combined_hhi": round(float(concentration.get("combined_hhi", 0.0)), 4),
        "reasons": reasons,
    }


async def fetch_entity_momentum(db: AsyncSession, *, time_window: str = "24h", limit: int = 10) -> dict[str, object]:
    now = datetime.now(UTC)
    window = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }.get(time_window, timedelta(hours=24))
    current_start = now - window
    previous_start = now - (window * 2)

    current_rows = (
        await db.execute(
            text(
                """
                SELECT entity_name AS name, COUNT(*)::int AS count
                FROM ai_developments,
                LATERAL jsonb_array_elements_text(COALESCE(entities, '[]'::jsonb)) AS entity_name
                WHERE published_at >= :current_start
                  AND published_at < :now
                  AND entity_name <> ''
                GROUP BY entity_name
                ORDER BY count DESC
                LIMIT 120
                """
            ),
            {"current_start": current_start, "now": now},
        )
    ).all()
    previous_rows = (
        await db.execute(
            text(
                """
                SELECT entity_name AS name, COUNT(*)::int AS count
                FROM ai_developments,
                LATERAL jsonb_array_elements_text(COALESCE(entities, '[]'::jsonb)) AS entity_name
                WHERE published_at >= :previous_start
                  AND published_at < :current_start
                  AND entity_name <> ''
                GROUP BY entity_name
                ORDER BY count DESC
                LIMIT 120
                """
            ),
            {"previous_start": previous_start, "current_start": current_start},
        )
    ).all()

    def _delta(current: int, previous: int) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100.0, 2)

    current_map = {str(name): int(count) for name, count in current_rows}
    previous_map = {str(name): int(count) for name, count in previous_rows}
    names = sorted(set(current_map.keys()) | set(previous_map.keys()))

    movers: list[dict[str, object]] = []
    for name in names:
        current = current_map.get(name, 0)
        previous = previous_map.get(name, 0)
        change = current - previous
        if current == 0 and previous == 0:
            continue
        movers.append(
            {
                "name": name,
                "current": current,
                "previous": previous,
                "change": change,
                "delta_percent": _delta(current, previous),
            }
        )

    movers.sort(key=lambda item: abs(int(item["change"])), reverse=True)
    bounded = max(1, min(limit, 20))
    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "entities": movers[:bounded],
    }


async def fetch_risk_trend(db: AsyncSession, *, time_window: str = "24h") -> dict[str, object]:
    now = datetime.now(UTC)
    if time_window == "1h":
        since = now - timedelta(hours=1)
        unit = "minute"
        steps = 12
        step_delta = timedelta(minutes=5)
    elif time_window == "24h":
        since = now - timedelta(hours=24)
        unit = "hour"
        steps = 24
        step_delta = timedelta(hours=1)
    elif time_window == "7d":
        since = now - timedelta(days=7)
        unit = "day"
        steps = 7
        step_delta = timedelta(days=1)
    else:
        since = now - timedelta(days=30)
        unit = "day"
        steps = 30
        step_delta = timedelta(days=1)

    total_rows = (
        await db.execute(
            text(
                f"""
                SELECT date_trunc('{unit}', published_at) AS bucket, COUNT(*)::int AS total
                FROM ai_developments
                WHERE published_at >= :since
                GROUP BY bucket
                ORDER BY bucket
                """
            ),
            {"since": since},
        )
    ).all()
    incidents_rows = (
        await db.execute(
            text(
                f"""
                SELECT date_trunc('{unit}', published_at) AS bucket, COUNT(*)::int AS total
                FROM ai_developments
                WHERE published_at >= :since
                  AND category = 'incidents'
                GROUP BY bucket
                ORDER BY bucket
                """
            ),
            {"since": since},
        )
    ).all()
    low_conf_rows = (
        await db.execute(
            text(
                f"""
                SELECT date_trunc('{unit}', published_at) AS bucket, COUNT(*)::int AS total
                FROM ai_developments
                WHERE published_at >= :since
                  AND confidence < 0.5
                GROUP BY bucket
                ORDER BY bucket
                """
            ),
            {"since": since},
        )
    ).all()

    total_map = {row[0]: int(row[1]) for row in total_rows}
    incidents_map = {row[0]: int(row[1]) for row in incidents_rows}
    low_conf_map = {row[0]: int(row[1]) for row in low_conf_rows}

    start = since.replace(second=0, microsecond=0)
    if unit == "hour":
        start = start.replace(minute=0)
    elif unit == "day":
        start = start.replace(hour=0, minute=0)
    buckets = [start + (step_delta * i) for i in range(steps)]

    labels: list[str] = []
    risk_scores: list[float] = []
    incidents_ratio: list[float] = []
    low_conf_ratio: list[float] = []

    for bucket in buckets:
        total = total_map.get(bucket, 0)
        incidents = incidents_map.get(bucket, 0)
        low_conf = low_conf_map.get(bucket, 0)
        ir = incidents / max(1, total)
        lr = low_conf / max(1, total)
        score = min(100.0, round((ir * 60.0 + lr * 40.0) * 100.0, 2))

        labels.append(bucket.strftime("%H:%M") if unit in {"minute", "hour"} else bucket.strftime("%Y-%m-%d"))
        risk_scores.append(score)
        incidents_ratio.append(round(ir * 100.0, 2))
        low_conf_ratio.append(round(lr * 100.0, 2))

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "xAxis": labels,
        "risk_score": risk_scores,
        "incidents_ratio_pct": incidents_ratio,
        "low_confidence_ratio_pct": low_conf_ratio,
    }


async def fetch_summary(db: AsyncSession, *, time_window: str = "24h") -> dict[str, object]:
    now = datetime.now(UTC)
    kpis = await fetch_kpis(db)
    brief = await fetch_brief_snapshot(db, time_window=time_window)
    risk = await fetch_risk_index(db, time_window=time_window)
    concentration = await fetch_concentration(db, time_window=time_window)
    momentum = await fetch_momentum(db, time_window=time_window, limit=3)

    bullets: list[str] = []
    bullets.append(f"Volume {kpis.h1.current} in last hour ({kpis.h1.delta_percent:+.1f}% vs previous hour).")
    top_category = brief.get("top_category", {}).get("name", "")
    if top_category:
        bullets.append(f"Top category: {top_category}.")
    top_jurisdiction = brief.get("top_jurisdiction", {}).get("name", "")
    if top_jurisdiction:
        bullets.append(f"Top jurisdiction: {top_jurisdiction}.")
    bullets.append(f"Risk index: {risk.get('score', 0):.1f} ({risk.get('level', 'low')}).")
    bullets.append(f"Concentration: {concentration.get('combined_hhi', 0):.3f} ({concentration.get('combined_level', 'low')}).")

    mover = (momentum.get("categories") or [None])[0]
    if mover and isinstance(mover, dict):
        name = mover.get("name", "")
        change = mover.get("change", 0)
        bullets.append(f"Top category mover: {name} ({change:+d}).")

    return {
        "generated_at": now.isoformat(),
        "time_window": time_window,
        "bullets": bullets[:6],
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
