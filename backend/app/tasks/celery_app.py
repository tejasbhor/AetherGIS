"""AetherGIS — Celery task definitions."""
from __future__ import annotations

from celery import Celery
import asyncio

from backend.app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "AetherGIS",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=120,
    task_time_limit=180,
)


@celery_app.task(bind=True, name="AetherGIS.pipeline.run")
def run_pipeline_task(self, job_payload: dict) -> dict:
    """Celery wrapper for the async pipeline."""
    from datetime import datetime, timezone
    from backend.app.services.pipeline import run_pipeline

    self.update_state(state="RUNNING", meta={"progress": 0.0, "message": "Starting pipeline"})

    try:
        result = asyncio.run(run_pipeline(
            job_id=job_payload["job_id"],
            layer_id=job_payload["layer_id"],
            data_source=job_payload["data_source"],
            bbox=job_payload["bbox"],
            time_start=datetime.fromisoformat(job_payload["time_start"]),
            time_end=datetime.fromisoformat(job_payload["time_end"]),
            resolution=job_payload["resolution"],
            interpolation_model=job_payload["interpolation_model"],
            n_intermediate=job_payload["n_intermediate"],
            include_low_confidence=job_payload["include_low_confidence"],
        ))
        return result.model_dump(mode="json")
    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise
