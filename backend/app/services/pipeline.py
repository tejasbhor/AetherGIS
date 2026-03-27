"""AetherGIS - FramePipeline: full orchestration from ingest to video output."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

import numpy as np
from skimage.metrics import peak_signal_noise_ratio as psnr
from skimage.metrics import structural_similarity as ssim

from backend.app.config import get_settings
from backend.app.models.schemas import ConfidenceClass, FrameMetadata, PipelineResult, QualityMetrics, JobStatus
from backend.app.services.confidence import compute_frame_stability_index, compute_temporal_consistency_score, score_generated_frame
from backend.app.services.interpolation import get_engine, interpolate_pair_with_segmentation
from backend.app.services.preprocessing import preprocess_sequence
from backend.app.services.video_gen import frames_to_video, save_frame_png, write_metadata_sidecar
from backend.app.services.wms_client import BHUVAN_LAYERS, GIBS_LAYERS, SatelliteFrame, get_wms_client
from backend.app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()
ProgressCallback = Callable[[float, str], None]


def _generate_timestamps(time_start: datetime, time_end: datetime, layer_temporal_res_minutes: float) -> list[datetime]:
    res = int(layer_temporal_res_minutes)
    if res <= 0:
        res = 10
    grid_minute = (time_start.minute // res) * res
    t = time_start.replace(minute=grid_minute, second=0, microsecond=0)
    timestamps = []
    while t <= time_end:
        timestamps.append(t)
        t += timedelta(minutes=res)
    return timestamps


def _compute_metrics(frame: np.ndarray, ref_a: np.ndarray, ref_b: np.ndarray) -> tuple[float, float]:
    psnr_a = psnr(ref_a, frame, data_range=1.0)
    psnr_b = psnr(ref_b, frame, data_range=1.0)
    avg_psnr = (psnr_a + psnr_b) / 2.0
    ssim_a = ssim(ref_a, frame, data_range=1.0, channel_axis=-1)
    ssim_b = ssim(ref_b, frame, data_range=1.0, channel_axis=-1)
    avg_ssim = (ssim_a + ssim_b) / 2.0
    return float(avg_psnr), float(avg_ssim)


async def run_pipeline(
    job_id: str,
    layer_id: str,
    data_source: str,
    bbox: list[float],
    time_start: datetime,
    time_end: datetime,
    resolution: int,
    interpolation_model: str,
    n_intermediate: int,
    include_low_confidence: bool,
    progress_callback: Optional[ProgressCallback] = None,
) -> PipelineResult:
    created_at = datetime.now(timezone.utc)
    logger.info('Pipeline started', job_id=job_id, layer=layer_id, data_source=data_source)

    def report(progress: float, message: str) -> None:
        if progress_callback:
            progress_callback(progress, message)

    layer_info = GIBS_LAYERS.get(layer_id) or BHUVAN_LAYERS.get(layer_id, {})
    temporal_res = float(layer_info.get('temporal_resolution_minutes', 1440.0))

    timestamps = _generate_timestamps(time_start, time_end, temporal_res)
    if len(timestamps) > settings.max_frames_per_session:
        timestamps = timestamps[:settings.max_frames_per_session]

    report(0.08, 'Fetching source imagery from server')
    async with get_wms_client(data_source) as client:
        observed_frames: list[SatelliteFrame] = await client.fetch_sequence(layer_id, bbox, timestamps, resolution)

    if len(observed_frames) < 2:
        return PipelineResult(
            job_id=job_id,
            status=JobStatus.failed,
            layer_id=layer_id,
            data_source=data_source,
            bbox=bbox,
            time_start=time_start,
            time_end=time_end,
            error='Insufficient valid frames retrieved from source imagery (< 2). This layer/time/AOI likely returned blank or duplicate frames.',
            created_at=created_at,
        )

    report(0.22, f'Fetched {len(observed_frames)} valid source frames')
    obs_images = [frame.image for frame in observed_frames]
    obs_times = [frame.timestamp for frame in observed_frames]
    preprocessed = preprocess_sequence(obs_images, obs_times, bbox)

    report(0.32, 'Preprocessing and validating frame sequence')
    engine = get_engine(interpolation_model)

    all_frames: list[np.ndarray] = []
    all_metadata: list[FrameMetadata] = []
    frame_idx = 0
    total_pairs = max(1, len(preprocessed.frames) - 1)

    for i, (obs_frame, obs_time) in enumerate(zip(preprocessed.frames, preprocessed.timestamps)):
        all_frames.append(obs_frame)
        all_metadata.append(FrameMetadata(frame_index=frame_idx, timestamp=obs_time, is_interpolated=False))
        frame_idx += 1

        if i >= len(preprocessed.gaps):
            break

        report(0.35 + (i / total_pairs) * 0.35, f'Interpolating pair {i + 1} of {total_pairs}')
        gap_info = preprocessed.gaps[i]
        frame_b = preprocessed.frames[i + 1]
        time_b = preprocessed.timestamps[i + 1]
        pair_flags = preprocessed.flags.get(i, []) + preprocessed.flags.get(i + 1, [])

        pair_score = score_generated_frame(obs_frame, frame_b, gap_info.gap_minutes, extra_flags=pair_flags)
        if pair_score.is_rejected:
            logger.warning('Frame pair rejected - no interpolation', pair_index=i, reason=pair_score.reject_reason)
            continue

        interp_result = interpolate_pair_with_segmentation(obs_frame, frame_b, gap_info, engine, n_intermediate)
        if not interp_result.generated_frames:
            continue

        for gen_frame, t_pos in zip(interp_result.generated_frames, interp_result.t_positions):
            approx_ts = obs_time + (time_b - obs_time) * t_pos
            frame_score = score_generated_frame(obs_frame, frame_b, gap_info.gap_minutes, extra_flags=pair_flags)
            cs = min(frame_score.confidence_score, gap_info.confidence_floor)
            cls = frame_score.confidence_class
            if cs < frame_score.confidence_score:
                from backend.app.services.confidence import classify_confidence
                cls = classify_confidence(cs)
            if cls == ConfidenceClass.low and not include_low_confidence:
                continue

            approx_psnr, approx_ssim = _compute_metrics(gen_frame, obs_frame, frame_b)
            all_frames.append(gen_frame)
            all_metadata.append(FrameMetadata(
                frame_index=frame_idx,
                timestamp=approx_ts,
                is_interpolated=True,
                confidence_score=cs,
                confidence_class=cls,
                model_used=engine.model_name,
                flow_consistency=frame_score.flow_consistency,
                mad_score=frame_score.mad_score,
                gap_minutes=gap_info.gap_minutes,
                gap_category=gap_info.category,
                psnr=approx_psnr,
                ssim=approx_ssim,
            ))
            frame_idx += 1

    sorted_pairs = sorted(zip(all_metadata, all_frames), key=lambda item: item[0].timestamp)
    all_metadata = [item[0] for item in sorted_pairs]
    all_frames = [item[1] for item in sorted_pairs]
    for idx, meta in enumerate(all_metadata):
        meta.frame_index = idx

    report(0.76, 'Computing analytics and exporting outputs')
    tcs = compute_temporal_consistency_score(all_frames)
    fsi = compute_frame_stability_index(all_frames)
    psnr_values = [meta.psnr for meta in all_metadata if meta.psnr is not None]
    ssim_values = [meta.ssim for meta in all_metadata if meta.ssim is not None]

    metrics = QualityMetrics(
        tcs=tcs,
        fsi=fsi,
        avg_psnr=float(np.mean(psnr_values)) if psnr_values else None,
        avg_ssim=float(np.mean(ssim_values)) if ssim_values else None,
        high_confidence_count=sum(1 for meta in all_metadata if meta.confidence_class == ConfidenceClass.high),
        medium_confidence_count=sum(1 for meta in all_metadata if meta.confidence_class == ConfidenceClass.medium),
        low_confidence_count=sum(1 for meta in all_metadata if meta.confidence_class == ConfidenceClass.low),
        rejected_count=0,
        total_frames=len(all_frames),
        interpolated_frames=sum(1 for meta in all_metadata if meta.is_interpolated),
        observed_frames=sum(1 for meta in all_metadata if not meta.is_interpolated),
    )

    export_dir = settings.exports_dir / job_id
    export_dir.mkdir(parents=True, exist_ok=True)

    obs_only_frames = [all_frames[idx] for idx, meta in enumerate(all_metadata) if not meta.is_interpolated]
    obs_only_meta = [meta for meta in all_metadata if not meta.is_interpolated]
    original_video_path = export_dir / 'original.mp4'
    frames_to_video(obs_only_frames, obs_only_meta, original_video_path, fps=5, show_overlay=True)

    interp_video_path = export_dir / 'interpolated.mp4'
    frames_to_video(all_frames, all_metadata, interp_video_path, fps=10, show_overlay=True)

    frames_dir = export_dir / 'frames'
    frames_dir.mkdir(exist_ok=True)
    for i, frame in enumerate(all_frames):
        save_frame_png(frame, frames_dir / f'frame_{i:04d}.png', metadata=all_metadata[i])

    sidecar_path = export_dir / 'metadata.json'
    write_metadata_sidecar(all_metadata, sidecar_path)

    completed_at = datetime.now(timezone.utc)
    report(1.0, 'Pipeline completed successfully')
    logger.info('Pipeline completed', job_id=job_id, total_frames=len(all_frames), duration_seconds=(completed_at - created_at).total_seconds())

    return PipelineResult(
        job_id=job_id,
        status=JobStatus.completed,
        layer_id=layer_id,
        data_source=data_source,
        bbox=bbox,
        time_start=time_start,
        time_end=time_end,
        original_video_url=f'/api/v1/pipeline/{job_id}/video/original',
        interpolated_video_url=f'/api/v1/pipeline/{job_id}/video/interpolated',
        frames=all_metadata,
        metrics=metrics,
        created_at=created_at,
        completed_at=completed_at,
    )
