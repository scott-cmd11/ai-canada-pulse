from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.models.ai_development import AIDevelopment

router = APIRouter(prefix="/maintenance")


@router.post("/purge-synthetic")
async def purge_synthetic(
    execute: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    synthetic_filter = AIDevelopment.url.ilike("https://example.com/%")

    before_count = int((await db.execute(select(func.count()).where(synthetic_filter))).scalar_one())
    deleted = 0
    if execute and before_count > 0:
        result = await db.execute(delete(AIDevelopment).where(synthetic_filter))
        await db.commit()
        deleted = int(result.rowcount or 0)

    after_count = int((await db.execute(select(func.count()).where(synthetic_filter))).scalar_one())
    return {
        "execute": execute,
        "synthetic_before": before_count,
        "deleted": deleted,
        "synthetic_after": after_count,
        "checked_at": datetime.now(UTC).isoformat(),
    }
