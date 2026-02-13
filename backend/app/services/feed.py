from datetime import UTC, datetime, timedelta

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.ai_development import AIDevelopment


def parse_time_window(time_window: str) -> timedelta:
    mapping = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    return mapping.get(time_window, timedelta(hours=24))


def build_feed_query(
    *,
    time_window: str,
    category: str | None,
    jurisdiction: str | None,
    language: str | None,
    search: str | None,
) -> Select[tuple[AIDevelopment]]:
    now = datetime.now(UTC)
    since = now - parse_time_window(time_window)

    clauses = [AIDevelopment.published_at >= since]
    if category:
        clauses.append(AIDevelopment.category == category)
    if jurisdiction:
        clauses.append(AIDevelopment.jurisdiction == jurisdiction)
    if language:
        clauses.append(AIDevelopment.language == language)
    if search:
        like = f"%{search}%"
        clauses.append(
            or_(
                AIDevelopment.title.ilike(like),
                AIDevelopment.publisher.ilike(like),
                AIDevelopment.jurisdiction.ilike(like),
            )
        )

    return (
        select(AIDevelopment)
        .where(and_(*clauses))
        .order_by(AIDevelopment.published_at.desc(), AIDevelopment.ingested_at.desc())
    )


async def fetch_feed(
    db: AsyncSession,
    *,
    time_window: str,
    category: str | None,
    jurisdiction: str | None,
    language: str | None,
    search: str | None,
    page: int,
    page_size: int,
) -> tuple[list[AIDevelopment], int]:
    base_query = build_feed_query(
        time_window=time_window,
        category=category,
        jurisdiction=jurisdiction,
        language=language,
        search=search,
    )
    total_query = select(func.count()).select_from(base_query.subquery())

    total = int((await db.execute(total_query)).scalar_one())
    offset = (page - 1) * page_size
    rows = (await db.execute(base_query.offset(offset).limit(page_size))).scalars().all()

    return rows, total
