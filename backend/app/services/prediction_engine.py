"""AetherGIS — Multi-Step Future Prediction Engine (MODULE 2).

Extrapolates optical-flow motion from the last 2–3 observed frames to
synthesise plausible future satellite imagery (5–30 min ahead).

All outputs are labelled PREDICTED (LOW CONFIDENCE) — never suitable
for operational forecasting.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import numpy as np


def _to_gray(frame: np.ndarray) -> np.ndarray:
    if frame.ndim == 3:
        return (0.299 * frame[:, :, 0] + 0.587 * frame[:, :, 1] + 0.114 * frame[:, :, 2])
    return frame.astype(np.float32)


def _phase_motion(a: np.ndarray, b: np.ndarray) -> Tuple[float, float]:
    fa = np.fft.fft2(a - a.mean())
    fb = np.fft.fft2(b - b.mean())
    denom = np.abs(fa * np.conj(fb)) + 1e-9
    cross = (fa * np.conj(fb)) / denom
    corr = np.real(np.fft.ifft2(cross))
    h, w = corr.shape
    peak = np.unravel_index(np.argmax(corr), corr.shape)
    dy = peak[0] if peak[0] < h // 2 else peak[0] - h
    dx = peak[1] if peak[1] < w // 2 else peak[1] - w
    return float(dx), float(dy)


def _warp_frame(frame: np.ndarray, dx: float, dy: float) -> np.ndarray:
    """Translate a frame by (dx, dy) pixels using numpy roll."""
    shifted = np.roll(frame, int(round(dy)), axis=0)
    shifted = np.roll(shifted, int(round(dx)), axis=1)
    return shifted


def predict_future_frames(
    observed_frames: List[np.ndarray],
    n_ahead: int = 3,
    step_minutes: int = 10,
    last_timestamp: Optional[datetime] = None,
) -> List[dict]:
    """
    Given a sequence of observed frames, predict `n_ahead` future frames
    by extrapolating average optical-flow motion.

    Returns list of prediction dicts:
        frame_index, timestamp, confidence, label, preview_data (base64 png)
    """
    import base64
    import io

    if len(observed_frames) < 2:
        return []

    # Estimate motion from last 2 frames
    grays = [_to_gray(f) for f in observed_frames[-3:]]
    motions = []
    for i in range(1, len(grays)):
        dx, dy = _phase_motion(grays[i - 1], grays[i])
        motions.append((dx, dy))

    # Weighted average — more weight to most recent motion
    weights = np.linspace(0.5, 1.0, len(motions))
    weights /= weights.sum()
    avg_dx = sum(m[0] * w for m, w in zip(motions, weights))
    avg_dy = sum(m[1] * w for m, w in zip(motions, weights))

    last_frame = observed_frames[-1]
    base_ts = last_timestamp or datetime.utcnow()
    results = []

    current = last_frame.copy()
    for step in range(1, n_ahead + 1):
        # Confidence degrades with each step
        confidence = max(0.05, 0.4 - step * 0.08)
        # Warp by extrapolated motion
        current = _warp_frame(current, avg_dx, avg_dy)

        # Encode as base64 PNG for direct embedding
        try:
            from PIL import Image
            img_arr = (np.clip(current, 0, 1) * 255).astype(np.uint8)
            pil_img = Image.fromarray(img_arr)
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG", optimize=True)
            b64 = base64.b64encode(buf.getvalue()).decode()
            data_url = f"data:image/png;base64,{b64}"
        except Exception:
            data_url = None

        ts = (base_ts + timedelta(minutes=step * step_minutes)).isoformat() + "Z"
        results.append({
            "step": step,
            "minutes_ahead": step * step_minutes,
            "timestamp": ts,
            "confidence": round(confidence, 3),
            "label": "PREDICTED (LOW CONFIDENCE)",
            "motion_dx": round(avg_dx * step, 2),
            "motion_dy": round(avg_dy * step, 2),
            "data_url": data_url,
        })

    return results
