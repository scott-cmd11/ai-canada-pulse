from celery import Celery

from backend.app.core.config import settings
from workers.app.source_registry import list_source_definitions


def _build_source_beat_schedule() -> dict[str, dict[str, object]]:
    schedule: dict[str, dict[str, object]] = {}
    for source in list_source_definitions(include_disabled=False):
        schedule[f"ingest-{source.key}-every-{source.cadence_minutes}m"] = {
            "task": "workers.app.tasks.ingest_source_developments",
            "schedule": float(source.cadence_minutes * 60),
            "kwargs": {"source_key": source.key},
        }
    return schedule


celery_app = Celery("ai_pulse_worker")
celery_app.conf.update(
    broker_url=settings.redis_url,
    result_backend="redis://redis:6379/1",
    timezone="UTC",
    enable_utc=True,
    beat_schedule=_build_source_beat_schedule(),
)
celery_app.autodiscover_tasks(["workers.app"])
