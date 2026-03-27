"""AetherGIS FastAPI - API routes: pipeline."""
from __future__ import annotations
import asyncio
import uuid
from typing import Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.config import get_settings
from backend.app.models.schemas import JobStatus, JobStatusResponse, PipelineResult, PipelineRunRequest
from backend.app.services.job_store import complete_job, create_job, fail_job, get_job, update_job
from backend.app.utils.logging import get_logger
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])
logger = get_logger(__name__)
settings = get_settings()
def _payload_from_request(job_id: str, request: PipelineRunRequest) -> dict[str, Any]:
    return {
        "job_id": job_id,
        "layer_id": request.layer_id,
        "data_source": request.data_source.value,
        "bbox": request.bbox,
        "time_start": request.time_start.isoformat(),
        "time_end": request.time_end.isoformat(),
        "resolution": request.resolution,
        "interpolation_model": request.interpolation_model.value,
        "n_intermediate": request.n_intermediate,
        "include_low_confidence": request.include_low_confidence,
    }
async def _run_pipeline_in_process(payload: dict[str, Any]) -> None:
    from datetime import datetime
    from backend.app.services.pipeline import run_pipeline as run_pipeline_service
    job_id = payload["job_id"]
    update_job(job_id, status=JobStatus.running, progress=0.02, message="Initializing pipeline")
    try:
        result = await run_pipeline_service(
            job_id=job_id,
            layer_id=payload["layer_id"],
            data_source=payload["data_source"],
            bbox=payload["bbox"],
            time_start=datetime.fromisoformat(payload["time_start"]),
            time_end=datetime.fromisoformat(payload["time_end"]),
            resolution=payload["resolution"],
            interpolation_model=payload["interpolation_model"],
            n_intermediate=payload["n_intermediate"],
            include_low_confidence=payload["include_low_confidence"],
            progress_callback=lambda progress, message: update_job(
                job_id,
                status=JobStatus.running,
                progress=progress,
                message=message,
            ),
        )
        complete_job(job_id, result.model_dump(mode="json"))
    except Exception as exc:
        logger.exception("In-process pipeline execution failed", job_id=job_id)
        fail_job(job_id, str(exc))
@router.post("/run", response_model=dict)
async def run_pipeline(request: PipelineRunRequest) -> dict[str, str]:
    """Submit a pipeline job and return the job ID."""
    job_id = str(uuid.uuid4())
    payload = _payload_from_request(job_id, request)
    try:
        from backend.app.tasks.celery_app import run_pipeline_task
        run_pipeline_task.apply_async(args=[payload], task_id=job_id)
        logger.info("Pipeline job queued", job_id=job_id, layer=request.layer_id, mode="celery")
    except Exception as exc:
        logger.warning("Celery unavailable - running pipeline in process", error=str(exc), job_id=job_id)
        create_job(job_id, message="Queued for in-process execution")
        asyncio.create_task(_run_pipeline_in_process(payload))
    return {"job_id": job_id, "status": "QUEUED"}
@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: str) -> JobStatusResponse:
    """Poll the status of a pipeline job."""
    local_job = get_job(job_id)
    if local_job is not None:
        return JobStatusResponse(
            job_id=job_id,
            status=local_job.status,
            progress=local_job.progress,
            message=local_job.message,
            error=local_job.error,
        )
    try:
        from celery.result import AsyncResult
        from backend.app.tasks.celery_app import celery_app
        result = AsyncResult(job_id, app=celery_app)
        state_map = {
            "PENDING": JobStatus.queued,
            "STARTED": JobStatus.running,
            "RUNNING": JobStatus.running,
            "SUCCESS": JobStatus.completed,
            "FAILURE": JobStatus.failed,
        }
        status = state_map.get(result.state, JobStatus.queued)
        meta = result.info or {}
        error = None
        if result.state == "FAILURE":
            error = str(result.result)
        return JobStatusResponse(
            job_id=job_id,
            status=status,
            progress=meta.get("progress") if isinstance(meta, dict) else None,
            message=meta.get("message") if isinstance(meta, dict) else None,
            error=error,
        )
    except Exception:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
@router.get("/{job_id}/results", response_model=PipelineResult)
async def get_job_results(job_id: str) -> Any:
    """Retrieve full pipeline results once job is COMPLETED."""
    local_job = get_job(job_id)
    if local_job is not None:
        if local_job.status != JobStatus.completed or local_job.result is None:
            raise HTTPException(status_code=202, detail=f"Job not completed yet. Status: {local_job.status.value}")
        return local_job.result
    try:
        from celery.result import AsyncResult
        from backend.app.tasks.celery_app import celery_app
        result = AsyncResult(job_id, app=celery_app)
        if result.state != "SUCCESS":
            raise HTTPException(status_code=202, detail=f"Job not completed yet. Status: {result.state}")
        return result.result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))
@router.get("/{job_id}/video/{video_type}")
async def get_video(job_id: str, video_type: str) -> FileResponse:
    """Stream the original or interpolated video file."""
    if video_type not in ("original", "interpolated"):
        raise HTTPException(status_code=400, detail="video_type must be 'original' or 'interpolated'")
    video_path = settings.exports_dir / job_id / f"{video_type}.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail=f"Video not found for job {job_id}")
    return FileResponse(str(video_path), media_type="video/mp4")
@router.get("/{job_id}/frames/{frame_idx}")
async def get_frame(job_id: str, frame_idx: int) -> FileResponse:
    """Get a specific frame PNG from the output."""
    frame_path = settings.exports_dir / job_id / "frames" / f"frame_{frame_idx:04d}.png"
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail=f"Frame {frame_idx} not found")
    return FileResponse(str(frame_path), media_type="image/png")
@router.get("/{job_id}/metadata")
async def get_metadata(job_id: str) -> FileResponse:
    """Download the frame metadata JSON sidecar."""
    meta_path = settings.exports_dir / job_id / "metadata.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail=f"Metadata not found for job {job_id}")
    return FileResponse(str(meta_path), media_type="application/json")
