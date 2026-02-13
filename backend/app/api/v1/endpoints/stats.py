from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.ai_development import EChartsTimeseriesResponse, KPIsResponse, StatsAlertsResponse
from backend.app.services.stats import (
    fetch_entities_breakdown,
    fetch_alerts,
    fetch_brief_snapshot,
    fetch_concentration,
    fetch_confidence_profile,
    fetch_momentum,
    fetch_scope_compare,
    fetch_hourly_timeseries,
    fetch_jurisdictions_breakdown,
    fetch_kpis,
    fetch_sources_breakdown,
    fetch_tags_breakdown,
    fetch_weekly_timeseries,
)

router = APIRouter(prefix="/stats")


@router.get("/kpis", response_model=KPIsResponse)
async def get_kpis(db: AsyncSession = Depends(get_db)) -> KPIsResponse:
    return await fetch_kpis(db)


@router.get("/hourly", response_model=EChartsTimeseriesResponse)
async def get_hourly(db: AsyncSession = Depends(get_db)) -> EChartsTimeseriesResponse:
    return await fetch_hourly_timeseries(db)


@router.get("/weekly", response_model=EChartsTimeseriesResponse)
async def get_weekly(db: AsyncSession = Depends(get_db)) -> EChartsTimeseriesResponse:
    return await fetch_weekly_timeseries(db)


@router.get("/sources")
async def get_sources_breakdown(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_sources_breakdown(db, time_window=time_window, limit=limit)


@router.get("/jurisdictions")
async def get_jurisdictions_breakdown(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    limit: int = Query(12, ge=1, le=25),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_jurisdictions_breakdown(db, time_window=time_window, limit=limit)


@router.get("/entities")
async def get_entities_breakdown(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    limit: int = Query(12, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_entities_breakdown(db, time_window=time_window, limit=limit)


@router.get("/tags")
async def get_tags_breakdown(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    limit: int = Query(14, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_tags_breakdown(db, time_window=time_window, limit=limit)


@router.get("/brief")
async def get_brief_snapshot(
    time_window: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_brief_snapshot(db, time_window=time_window)


@router.get("/compare")
async def get_scope_compare(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_scope_compare(db, time_window=time_window)


@router.get("/confidence")
async def get_confidence_profile(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_confidence_profile(db, time_window=time_window)


@router.get("/concentration")
async def get_concentration(
    time_window: str = Query("7d", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_concentration(db, time_window=time_window)


@router.get("/momentum")
async def get_momentum(
    time_window: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await fetch_momentum(db, time_window=time_window, limit=limit)


@router.get("/alerts", response_model=StatsAlertsResponse)
async def get_alerts(
    time_window: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    min_baseline: int = Query(3, ge=1, le=100),
    min_delta_percent: float = Query(35.0, ge=1.0, le=500.0),
    db: AsyncSession = Depends(get_db),
) -> StatsAlertsResponse:
    return await fetch_alerts(
        db,
        time_window=time_window,
        min_baseline=min_baseline,
        min_delta_percent=min_delta_percent,
    )
