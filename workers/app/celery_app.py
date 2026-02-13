from celery import Celery

from backend.app.core.config import settings

celery_app = Celery("ai_pulse_worker")
celery_app.conf.update(
    broker_url=settings.redis_url,
    result_backend="redis://redis:6379/1",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "ingest-live-ai-developments-every-30s": {
            "task": "workers.app.tasks.ingest_live_developments",
            "schedule": 30.0,
        }
    },
)
celery_app.autodiscover_tasks(["workers.app"])
