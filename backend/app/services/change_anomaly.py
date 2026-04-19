"""AetherGIS — Change Detection + Anomaly Detection (MODULE 7 + 8).

MODULE 7 — Change Detection:
  • Difference maps between consecutive frames
  • Motion masks (cloud movement regions)
  • Per-frame motion magnitude

MODULE 8 — Anomaly Detection:
  • Sudden intensity spike detection
  • Inconsistent motion detection
  • Abnormal structure detection
  • Per-frame label: NORMAL | ANOMALY
  • Anomaly score [0, 1]
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

import numpy as np

from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


# ── Change detection ──────────────────────────────────────────────────────────

@dataclass
class ChangeMap:
    frame_index: int
    diff_map: np.ndarray           # float32 H×W, absolute difference
    motion_mask: np.ndarray        # bool H×W, regions with significant motion
    motion_magnitude: float        # scalar — average motion in motion regions
    change_percentage: float       # % of pixels with significant change


def compute_change_map(
    frame_a: np.ndarray,
    frame_b: np.ndarray,
    frame_index: int,
    motion_threshold: float = 0.05,
) -> ChangeMap:
    """Compute per-pixel change between two frames."""
    # Absolute difference (luminance)
    diff = np.abs(frame_a.mean(axis=-1) - frame_b.mean(axis=-1))

    # Motion mask: pixels above threshold
    mask = diff > motion_threshold
    motion_mag = float(diff[mask].mean()) if mask.any() else 0.0
    change_pct = float(mask.sum() / mask.size * 100)

    # Enhance with optical flow if OpenCV available
    try:
        import cv2
        a_gray = (frame_a.mean(axis=-1) * 255).astype(np.uint8)
        b_gray = (frame_b.mean(axis=-1) * 255).astype(np.uint8)
        flow = cv2.calcOpticalFlowFarneback(a_gray, b_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        mag = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2)
        flow_norm = mag / (mag.max() + 1e-8)
        # Combine pixel diff with flow magnitude
        diff = (diff * 0.5 + flow_norm * 0.5).astype(np.float32)
        mask = diff > motion_threshold
        motion_mag = float(diff[mask].mean()) if mask.any() else 0.0
        change_pct = float(mask.sum() / mask.size * 100)
    except Exception:
        pass

    return ChangeMap(
        frame_index=frame_index,
        diff_map=diff.astype(np.float32),
        motion_mask=mask,
        motion_magnitude=motion_mag,
        change_percentage=change_pct,
    )


def _change_map_to_image(change: ChangeMap) -> np.ndarray:
    """Convert diff map to RGB image for export."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.cm as cm
        cmap = cm.get_cmap("hot")
        rgba = cmap(change.diff_map)
        return (rgba[:, :, :3] * 255).astype(np.uint8)
    except ImportError:
        intensity = (change.diff_map * 255).clip(0, 255).astype(np.uint8)
        h, w = intensity.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        rgb[:, :, 0] = intensity  # Red channel = change intensity
        return rgb


def save_change_map(change: ChangeMap, output_dir: Path) -> Path:
    from PIL import Image
    output_dir.mkdir(parents=True, exist_ok=True)
    rgb = _change_map_to_image(change)
    img = Image.fromarray(rgb)
    path = output_dir / f"change_map_{change.frame_index:04d}.png"
    img.save(str(path))
    return path


def compute_all_change_maps(
    frames: list[np.ndarray],
    job_id: str,
) -> list[ChangeMap]:
    """Compute change maps for consecutive frame pairs."""
    export_dir = settings.exports_dir / job_id / "change_maps"
    export_dir.mkdir(parents=True, exist_ok=True)

    changes: list[ChangeMap] = []
    for i in range(1, len(frames)):
        try:
            cm = compute_change_map(frames[i - 1], frames[i], frame_index=i)
            save_change_map(cm, export_dir)
            changes.append(cm)
        except Exception as exc:
            logger.warning("Change map failed", frame=i, error=str(exc))

    logger.info("Change maps computed", job_id=job_id, count=len(changes))
    return changes


# ── Anomaly detection ─────────────────────────────────────────────────────────

class AnomalyLabel(str, Enum):
    normal = "NORMAL"
    anomaly = "ANOMALY"


@dataclass
class FrameAnomalyResult:
    frame_index: int
    label: AnomalyLabel
    anomaly_score: float          # [0, 1] — 1 = strong anomaly
    intensity_spike: bool
    motion_anomaly: bool
    structure_anomaly: bool
    details: dict


def _intensity_spike_score(frame: np.ndarray, history: list[np.ndarray]) -> float:
    """Detect sudden intensity changes vs running mean."""
    if not history:
        return 0.0
    current_mean = float(frame.mean())
    history_means = [float(f.mean()) for f in history[-5:]]
    hist_mean = float(np.mean(history_means))
    hist_std = float(np.std(history_means)) + 1e-6
    z_score = abs(current_mean - hist_mean) / hist_std
    # Normalise: z > 3 → anomaly
    return float(min(z_score / 3.0, 1.0))


def _motion_anomaly_score(
    change_map: Optional[ChangeMap],
    change_history: list[ChangeMap],
) -> float:
    """Detect inconsistent motion vs history."""
    if change_map is None or not change_history:
        return 0.0
    hist_mags = [c.motion_magnitude for c in change_history[-5:]]
    hist_mean = float(np.mean(hist_mags)) + 1e-6
    hist_std = float(np.std(hist_mags)) + 1e-6
    z_score = abs(change_map.motion_magnitude - hist_mean) / hist_std
    return float(min(z_score / 3.0, 1.0))


def _structure_anomaly_score(frame: np.ndarray) -> float:
    """Detect abnormal spatial structures (e.g. compression artefacts, blank regions)."""
    # 1. Check for near-uniform regions (possible data dropout)
    channel_std = float(frame.std())
    if channel_std < 0.01:
        return 0.9  # Near-blank frame

    # 2. Check for extreme saturation
    saturated = (frame > 0.98).mean() + (frame < 0.02).mean()
    if saturated > 0.3:
        return float(min(saturated * 2, 1.0))

    # 3. Block artefact detection via local variance
    try:
        h, w = frame.shape[:2]
        block_size = max(8, h // 32)
        gray = frame.mean(axis=-1)
        var_map = []
        for row in range(0, h - block_size, block_size):
            for col in range(0, w - block_size, block_size):
                block = gray[row:row + block_size, col:col + block_size]
                var_map.append(float(block.var()))
        if var_map:
            var_arr = np.array(var_map)
            # Coefficient of variation
            cv = var_arr.std() / (var_arr.mean() + 1e-8)
            # Very high CV → blocky/artefact-ridden
            return float(min(cv / 5.0, 1.0))
    except Exception:
        pass

    return 0.0


def detect_anomaly(
    frame: np.ndarray,
    frame_index: int,
    frame_history: list[np.ndarray],
    change_map: Optional[ChangeMap] = None,
    change_history: Optional[list[ChangeMap]] = None,
    anomaly_threshold: float = 0.5,
    w_intensity: float = 0.4,
    w_motion: float = 0.35,
    w_structure: float = 0.25,
) -> FrameAnomalyResult:
    if change_history is None:
        change_history = []

    intensity_score = _intensity_spike_score(frame, frame_history)
    motion_score = _motion_anomaly_score(change_map, change_history)
    structure_score = _structure_anomaly_score(frame)

    composite = (
        w_intensity * intensity_score
        + w_motion * motion_score
        + w_structure * structure_score
    )

    label = AnomalyLabel.anomaly if composite >= anomaly_threshold else AnomalyLabel.normal

    return FrameAnomalyResult(
        frame_index=frame_index,
        label=label,
        anomaly_score=float(composite),
        intensity_spike=intensity_score > 0.6,
        motion_anomaly=motion_score > 0.6,
        structure_anomaly=structure_score > 0.6,
        details={
            "intensity_score": round(intensity_score, 4),
            "motion_score": round(motion_score, 4),
            "structure_score": round(structure_score, 4),
        },
    )


def run_anomaly_detection(
    frames: list[np.ndarray],
    change_maps: list[ChangeMap],
    job_id: str,
) -> list[FrameAnomalyResult]:
    """Run anomaly detection over entire frame sequence."""
    results: list[FrameAnomalyResult] = []
    frame_history: list[np.ndarray] = []
    change_history: list[ChangeMap] = []

    for i, frame in enumerate(frames):
        change_map = change_maps[i - 1] if i > 0 and (i - 1) < len(change_maps) else None

        result = detect_anomaly(
            frame, i, frame_history, change_map, change_history
        )
        results.append(result)

        if result.label == AnomalyLabel.anomaly:
            logger.warning(
                "Anomaly detected",
                job_id=job_id,
                frame_idx=i,
                score=round(result.anomaly_score, 3),
            )

        frame_history.append(frame)
        if change_map:
            change_history.append(change_map)

    normal_count = sum(1 for r in results if r.label == AnomalyLabel.normal)
    anomaly_count = len(results) - normal_count
    logger.info(
        "Anomaly detection complete",
        job_id=job_id,
        total=len(results),
        anomalies=anomaly_count,
        normal=normal_count,
    )
    return results
