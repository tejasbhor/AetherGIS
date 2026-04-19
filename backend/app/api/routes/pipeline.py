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
        "step_minutes": request.step_minutes,
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
            step_minutes=payload.get("step_minutes"),
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


@router.post("/{job_id}/export/{video_type}")
async def export_video(job_id: str, video_type: str) -> dict:
    """Generate an MP4 on-demand from saved frame PNGs.

    Idempotent: if the file already exists, returns immediately with the URL.
    video_type: 'original' | 'interpolated' | 'all'
    """
    if video_type not in ("original", "interpolated", "all"):
        raise HTTPException(status_code=400, detail="video_type must be 'original', 'interpolated', or 'all'")

    export_dir = settings.exports_dir / job_id
    if not export_dir.exists():
        raise HTTPException(status_code=404, detail=f"Job {job_id} has no exported frames. Run the pipeline first.")

    video_path = export_dir / f"{video_type}.mp4"

    # Already generated — return immediately
    if video_path.exists():
        return {"status": "ready", "url": f"/api/v1/pipeline/{job_id}/video/{video_type}"}

    # Load metadata sidecar to reconstruct frame list
    import json
    import numpy as np
    import cv2
    from backend.app.services.video_gen import frames_to_video
    from backend.app.models.schemas import FrameMetadata

    sidecar = export_dir / "metadata.json"
    if not sidecar.exists():
        raise HTTPException(status_code=404, detail="Metadata sidecar not found.")

    with open(sidecar) as f:
        meta_list = [FrameMetadata(**m) for m in json.load(f)]

    frames_dir = export_dir / "frames"
    if not frames_dir.exists():
        raise HTTPException(status_code=404, detail="Frame directory not found.")

    # Filter frames based on video_type
    if video_type == "original":
        pairs = [(m, frames_dir / f"frame_{m.frame_index:04d}.png") for m in meta_list if not m.is_interpolated]
        fps = 5
    elif video_type == "interpolated":
        pairs = [(m, frames_dir / f"frame_{m.frame_index:04d}.png") for m in meta_list]
        fps = 10
    else:  # 'all' — same as interpolated
        pairs = [(m, frames_dir / f"frame_{m.frame_index:04d}.png") for m in meta_list]
        fps = 10

    pairs = [(m, p) for m, p in pairs if p.exists()]
    if not pairs:
        raise HTTPException(status_code=404, detail="No frame PNGs found for this job.")

    loaded_frames = []
    loaded_meta = []
    for meta, path in pairs:
        img = cv2.imread(str(path))
        if img is None:
            continue
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        loaded_frames.append(img_rgb)
        loaded_meta.append(meta)

    if not loaded_frames:
        raise HTTPException(status_code=500, detail="Failed to load frame images.")

    frames_to_video(loaded_frames, loaded_meta, video_path, fps=fps, show_overlay=True)
    logger.info("On-demand video export complete", job_id=job_id, video_type=video_type, frames=len(loaded_frames))
    return {"status": "ready", "url": f"/api/v1/pipeline/{job_id}/video/{video_type}"}


@router.get("/{job_id}/export/{video_type}/status")
async def export_video_status(job_id: str, video_type: str) -> dict:
    """Check whether an exported video is ready without triggering generation."""
    if video_type not in ("original", "interpolated", "all"):
        raise HTTPException(status_code=400, detail="video_type must be 'original', 'interpolated', or 'all'")
    video_path = settings.exports_dir / job_id / f"{video_type}.mp4"
    if video_path.exists():
        return {"status": "ready", "url": f"/api/v1/pipeline/{job_id}/video/{video_type}"}
    return {"status": "not_generated"}


async def cancel_pipeline(job_id: str) -> dict[str, str]:
    """Cancel a running pipeline job."""
    try:
        from backend.app.tasks.celery_app import celery_app
        celery_app.control.revoke(job_id, terminate=True, signal='SIGKILL')
    except Exception as e:
        logger.warning("Failed to revoke celery task", error=str(e), job_id=job_id)
        
    from backend.app.services.job_store import fail_job, get_job
    if get_job(job_id):
        fail_job(job_id, "Cancelled by user")
        
    return {"status": "CANCELLED", "job_id": job_id}


@router.delete("/{job_id}", status_code=200)
async def delete_job(job_id: str) -> dict[str, str]:
    """Delete a pipeline job: removes export files from disk and purges from job store.

    Called by the frontend when a user deletes a session from the Session Manager.
    This is the correct place to free disk space — purely additive, never breaks existing jobs.
    """
    import shutil
    from backend.app.services.job_store import get_job

    # Validate UUID format to prevent path traversal
    try:
        import uuid
        uuid.UUID(job_id, version=4)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    export_dir = settings.exports_dir / job_id
    deleted_disk = False
    if export_dir.exists():
        shutil.rmtree(export_dir, ignore_errors=True)
        deleted_disk = True
        logger.info("Job export directory deleted", job_id=job_id, path=str(export_dir))

    # Remove from in-process job store (best-effort — Celery jobs live in Redis)
    from backend.app.services.job_store import _jobs  # type: ignore[attr-defined]
    _jobs.pop(job_id, None)

    return {
        "job_id": job_id,
        "status": "deleted",
        "disk_cleaned": str(deleted_disk),
    }


@router.delete("/cleanup/old", status_code=200)
async def cleanup_old_jobs(keep_last: int = 20) -> dict:
    """Delete export directories for all jobs except the most recent `keep_last`.

    Useful for freeing disk space. The front-end session limit is 20, so the
    default here matches. Call from a scheduled task or manually from the Tools menu.
    """
    import shutil
    from backend.app.services.job_store import _jobs  # type: ignore[attr-defined]

    if keep_last < 1:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="keep_last must be >= 1")

    # List all job dirs sorted by modification time (newest first)
    job_dirs = sorted(
        [d for d in settings.exports_dir.iterdir() if d.is_dir()],
        key=lambda d: d.stat().st_mtime,
        reverse=True,
    )

    keep_dirs = {d.name for d in job_dirs[:keep_last]}
    to_delete = [d for d in job_dirs if d.name not in keep_dirs]

    deleted = []
    freed_bytes = 0
    for d in to_delete:
        try:
            size = sum(f.stat().st_size for f in d.rglob("*") if f.is_file())
            shutil.rmtree(d, ignore_errors=True)
            _jobs.pop(d.name, None)
            deleted.append(d.name)
            freed_bytes += size
            logger.info("Cleaned up old job", job_id=d.name, freed_mb=round(size / 1_048_576, 1))
        except Exception as exc:
            logger.warning("Failed to clean job dir", job_id=d.name, error=str(exc))

    return {
        "deleted_count": len(deleted),
        "freed_mb": round(freed_bytes / 1_048_576, 1),
        "kept": keep_last,
        "deleted_job_ids": deleted,
    }
