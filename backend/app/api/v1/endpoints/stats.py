from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.ai_development import EChartsTimeseriesResponse, KPIsResponse
from backend.app.services.stats import fetch_hourly_timeseries, fetch_kpis, fetch_weekly_timeseries

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
