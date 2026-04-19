"""AetherGIS — Time-Series Analytics (MODULE 6) & Metric Evolution (MODULE 14)."""
from __future__ import annotations

from typing import List, Optional
import numpy as np


def _to_gray(frame: np.ndarray) -> np.ndarray:
    if frame.ndim == 3:
        return (0.299 * frame[:, :, 0] + 0.587 * frame[:, :, 1] + 0.114 * frame[:, :, 2]).astype(np.float32)
    return frame.astype(np.float32)


def _cloud_coverage(gray: np.ndarray, threshold: float = 0.55) -> float:
    return float(np.mean(gray > threshold))


def _motion_intensity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.mean(np.abs(a.astype(np.float32) - b.astype(np.float32))))


def compute_time_series(
    frames: List[np.ndarray],
    timestamps: Optional[List[str]] = None,
) -> dict:
    """
    Compute temporal trends over a frame sequence.

    Returns:
        brightness_trend, motion_trend, coverage_trend, change_rate
    """
    if not frames:
        return {"brightness_trend": [], "motion_trend": [], "coverage_trend": [], "change_rate": 0.0}

    grays = [_to_gray(f) for f in frames]
    ts = timestamps or [str(i) for i in range(len(frames))]

    brightness_trend = [{"t": ts[i], "value": round(float(grays[i].mean()), 5)}
                        for i in range(len(grays))]

    motion_trend = [{"t": ts[i], "value": 0.0} for i in range(len(grays))]
    for i in range(1, len(grays)):
        motion_trend[i]["value"] = round(_motion_intensity(grays[i - 1], grays[i]), 5)

    coverage_trend = [{"t": ts[i], "value": round(_cloud_coverage(grays[i]), 4)}
                      for i in range(len(grays))]

    # Global change rate: average absolute slope of brightness
    if len(brightness_trend) > 1:
        diffs = [abs(brightness_trend[i]["value"] - brightness_trend[i - 1]["value"])
                 for i in range(1, len(brightness_trend))]
        change_rate = round(float(np.mean(diffs)), 6)
    else:
        change_rate = 0.0

    return {
        "brightness_trend": brightness_trend,
        "motion_trend": motion_trend,
        "coverage_trend": coverage_trend,
        "change_rate": change_rate,
        "mean_brightness": round(float(np.mean([b["value"] for b in brightness_trend])), 5),
        "mean_coverage": round(float(np.mean([c["value"] for c in coverage_trend])), 4),
    }


def compute_metric_evolution(
    frame_metadata: List[dict],
) -> dict:
    """
    Track PSNR / SSIM / confidence evolution across frames.

    frame_metadata: list of FrameMetadata dicts (from pipeline result).
    """
    psnr_trend, ssim_trend, conf_trend = [], [], []

    for meta in frame_metadata:
        ts = meta.get("timestamp", "")
        if meta.get("psnr") is not None:
            psnr_trend.append({"t": ts, "value": round(float(meta["psnr"]), 3), "is_interpolated": meta.get("is_interpolated", False)})
        if meta.get("ssim") is not None:
            ssim_trend.append({"t": ts, "value": round(float(meta["ssim"]), 4), "is_interpolated": meta.get("is_interpolated", False)})
        if meta.get("confidence_score") is not None:
            conf_trend.append({"t": ts, "value": round(float(meta["confidence_score"]), 4), "class": meta.get("confidence_class", "UNKNOWN")})

    avg_psnr = round(float(np.mean([p["value"] for p in psnr_trend])), 3) if psnr_trend else None
    avg_ssim = round(float(np.mean([s["value"] for s in ssim_trend])), 4) if ssim_trend else None
    avg_conf = round(float(np.mean([c["value"] for c in conf_trend])), 4) if conf_trend else None

    # Stability: std dev of confidence
    conf_stability = round(float(np.std([c["value"] for c in conf_trend])), 5) if len(conf_trend) > 1 else 0.0

    return {
        "psnr_trend": psnr_trend,
        "ssim_trend": ssim_trend,
        "confidence_trend": conf_trend,
        "avg_psnr": avg_psnr,
        "avg_ssim": avg_ssim,
        "avg_confidence": avg_conf,
        "confidence_stability": conf_stability,
    }
