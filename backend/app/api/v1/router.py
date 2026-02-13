from fastapi import APIRouter

from backend.app.api.v1.endpoints import feed, stats

api_router = APIRouter()
api_router.include_router(feed.router, tags=["feed"])
api_router.include_router(stats.router, tags=["stats"])
