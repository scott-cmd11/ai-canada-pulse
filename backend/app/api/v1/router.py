from fastapi import APIRouter

from backend.app.api.v1.endpoints import backfill, feed, maintenance, sources, stats

api_router = APIRouter()
api_router.include_router(feed.router, tags=["feed"])
api_router.include_router(stats.router, tags=["stats"])
api_router.include_router(backfill.router, tags=["backfill"])
api_router.include_router(maintenance.router, tags=["maintenance"])
api_router.include_router(sources.router, tags=["sources"])
