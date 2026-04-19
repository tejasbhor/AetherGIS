"""AetherGIS — Interpolation Explainability Engine (MODULE 3).

For each interpolated frame, computes:
  • motion source regions — where flow originated
  • high-uncertainty zones — where the model is less confident
  • confidence zones — areas of strong structural agreement
  • an overlay PNG (RGBA heat-map) ready for map rendering
"""
from __future__ import annotations

import io
import base64
from typing import List, Optional
import numpy as np


def _to_gray(frame: np.ndarray) -> np.ndarray:
    if frame.ndim == 3:
        return (0.299 * frame[:, :, 0] + 0.587 * frame[:, :, 1] + 0.114 * frame[:, :, 2])
    return frame.astype(np.float32)


def _build_diff_map(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    ga, gb = _to_gray(a), _to_gray(b)
    return np.abs(ga.astype(np.float32) - gb.astype(np.float32))


def _region_grid(score_map: np.ndarray, threshold_pct: float = 0.70) -> List[dict]:
    """Return list of normalised [x1,y1,x2,y2] bounding boxes above a percentile."""
    h, w = score_map.shape
    threshold = float(np.percentile(score_map, threshold_pct * 100))
    hot = (score_map > threshold).astype(np.uint8)
    grid = 8
    ch, cw = max(1, h // grid), max(1, w // grid)
    regions = []
    for gy in range(grid):
        for gx in range(grid):
            y1, y2 = gy * ch, min((gy + 1) * ch, h)
            x1, x2 = gx * cw, min((gx + 1) * cw, w)
            if hot[y1:y2, x1:x2].mean() > 0.4:
                score = float(score_map[y1:y2, x1:x2].mean())
                regions.append({
                    "bbox": [round(x1 / w, 4), round(y1 / h, 4), round(x2 / w, 4), round(y2 / h, 4)],
                    "score": round(score, 4),
                })
    regions.sort(key=lambda r: r["score"], reverse=True)
    return regions[:12]


def _encode_overlay(rgba: np.ndarray) -> str:
    """Encode RGBA numpy array as data URL."""
    from PIL import Image
    pil = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), mode="RGBA")
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def generate_explanation(
    frame: np.ndarray,
    prev_frame: Optional[np.ndarray],
    next_frame: Optional[np.ndarray],
    frame_index: int = 0,
) -> dict:
    """
    Generate an explainability report for a single interpolated frame.

    Returns:
        frame_index, motion_sources, uncertainty_regions, confidence_zones,
        overlay_url (RGBA data URL)
    """
    h, w = frame.shape[:2]

    # ── Motion source map: difference between bracketing frames
    if prev_frame is not None and next_frame is not None:
        motion_map = _build_diff_map(prev_frame, next_frame)
    elif prev_frame is not None:
        motion_map = _build_diff_map(prev_frame, frame)
    elif next_frame is not None:
        motion_map = _build_diff_map(frame, next_frame)
    else:
        motion_map = np.zeros((h, w), dtype=np.float32)

    # ── Uncertainty: how much the interpolated frame differs from its envelope
    uncertainty_map = np.zeros((h, w), dtype=np.float32)
    if prev_frame is not None:
        uncertainty_map += _build_diff_map(frame, prev_frame)
    if next_frame is not None:
        uncertainty_map += _build_diff_map(frame, next_frame)
    if prev_frame is not None and next_frame is not None:
        uncertainty_map /= 2.0

    # ── Confidence: inverse of uncertainty, weighted by local variance
    gray = _to_gray(frame)
    local_var = np.zeros_like(gray)
    k = 8
    for dy in range(-k, k + 1, k):
        for dx in range(-k, k + 1, k):
            shifted = np.roll(np.roll(gray, dy, 0), dx, 1)
            local_var += (gray - shifted) ** 2
    confidence_map = 1.0 - np.clip(uncertainty_map + local_var * 0.1, 0, 1)

    # ── Build RGBA overlay
    overlay = np.zeros((h, w, 4), dtype=np.uint8)
    # Red channel: uncertainty (hot spots)
    unc_norm = np.clip(uncertainty_map / (uncertainty_map.max() + 1e-9), 0, 1)
    overlay[:, :, 0] = (unc_norm * 200).astype(np.uint8)
    # Blue channel: confidence zones
    conf_norm = np.clip(confidence_map, 0, 1)
    overlay[:, :, 2] = (conf_norm * 180).astype(np.uint8)
    # Green channel: motion
    mot_norm = np.clip(motion_map / (motion_map.max() + 1e-9), 0, 1)
    overlay[:, :, 1] = (mot_norm * 160).astype(np.uint8)
    overlay[:, :, 3] = 120  # semi-transparent

    try:
        overlay_url = _encode_overlay(overlay)
    except Exception:
        overlay_url = None

    return {
        "frame_index": frame_index,
        "motion_sources": _region_grid(motion_map, 0.75),
        "uncertainty_regions": _region_grid(uncertainty_map, 0.80),
        "confidence_zones": _region_grid(confidence_map, 0.60),
        "global_uncertainty": round(float(uncertainty_map.mean()), 5),
        "global_confidence": round(float(confidence_map.mean()), 5),
        "overlay_url": overlay_url,
    }
