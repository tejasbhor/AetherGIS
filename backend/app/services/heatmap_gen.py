"""AetherGIS — Heatmap Generator (MODULE 10).

Generates:
  • motion heatmap     — cumulative motion magnitude over all frames
  • uncertainty heatmap — accumulated AI uncertainty
  • anomaly heatmap    — regions with frequent anomalous events
"""
from __future__ import annotations

import io
import base64
from typing import List, Literal
import numpy as np

HeatmapType = Literal["motion", "uncertainty", "anomaly"]


def _to_gray(frame: np.ndarray) -> np.ndarray:
    if frame.ndim == 3:
        return (0.299 * frame[:, :, 0] + 0.587 * frame[:, :, 1] + 0.114 * frame[:, :, 2]).astype(np.float32)
    return frame.astype(np.float32)


def _colormap_inferno(norm: np.ndarray) -> np.ndarray:
    """Simple inferno-like colourmap: black → purple → red → orange → yellow."""
    r = np.clip(norm * 1.4 - 0.2, 0, 1)
    g = np.clip(norm * 1.2 - 0.5, 0, 1)
    b = np.clip(0.8 - norm * 1.2, 0, 1)
    return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)


def _colormap_plasma(norm: np.ndarray) -> np.ndarray:
    r = np.clip(0.05 + norm * 0.9, 0, 1)
    g = np.clip(norm * 0.5 - 0.1, 0, 1)
    b = np.clip(0.6 - norm * 0.8, 0, 1)
    return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)


def _colormap_viridis(norm: np.ndarray) -> np.ndarray:
    r = np.clip(0.267 + norm * 0.733, 0, 1)
    g = np.clip(0.005 + norm * 0.876, 0, 1)
    b = np.clip(0.329 - norm * 0.1, 0, 1)
    return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)


def _encode_png(arr: np.ndarray) -> str:
    from PIL import Image
    pil = Image.fromarray(arr, mode="RGB")
    buf = io.BytesIO()
    pil.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def generate_motion_heatmap(frames: List[np.ndarray]) -> str:
    """Accumulate per-frame absolute differences → inferno heat map."""
    if len(frames) < 2:
        h, w = frames[0].shape[:2] if frames else (256, 256)
        dummy = np.zeros((h, w), dtype=np.float32)
        return _encode_png(_colormap_inferno(dummy))

    h, w = frames[0].shape[:2]
    accum = np.zeros((h, w), dtype=np.float32)
    for i in range(1, len(frames)):
        ga, gb = _to_gray(frames[i - 1]), _to_gray(frames[i])
        accum += np.abs(ga - gb)

    norm = np.clip(accum / (accum.max() + 1e-9), 0, 1)
    return _encode_png(_colormap_inferno(norm))


def generate_uncertainty_heatmap(frames: List[np.ndarray]) -> str:
    """Use temporal variance as proxy for AI uncertainty → plasma heat map."""
    if len(frames) < 2:
        h, w = frames[0].shape[:2] if frames else (256, 256)
        return _encode_png(_colormap_plasma(np.zeros((h, w), dtype=np.float32)))

    stack = np.stack([_to_gray(f) for f in frames], axis=0)  # (T, H, W)
    variance = stack.var(axis=0)
    norm = np.clip(variance / (variance.max() + 1e-9), 0, 1)
    return _encode_png(_colormap_plasma(norm))


def generate_anomaly_heatmap(frames: List[np.ndarray]) -> str:
    """Mark regions with unusually high local temporal fluctuation → viridis."""
    if len(frames) < 3:
        h, w = frames[0].shape[:2] if frames else (256, 256)
        return _encode_png(_colormap_viridis(np.zeros((h, w), dtype=np.float32)))

    stack = np.stack([_to_gray(f) for f in frames], axis=0)
    median = np.median(stack, axis=0)
    mad = np.mean(np.abs(stack - median), axis=0)

    # Anomaly = frames that deviate > 2σ from local median
    sigma = mad.mean()
    anomaly_map = np.clip((mad - sigma) / (sigma + 1e-9), 0, 1)
    return _encode_png(_colormap_viridis(anomaly_map))


def generate_heatmap(frames: List[np.ndarray], heatmap_type: HeatmapType) -> str:
    """Entry point — dispatch to the appropriate generator."""
    if heatmap_type == "motion":
        return generate_motion_heatmap(frames)
    elif heatmap_type == "uncertainty":
        return generate_uncertainty_heatmap(frames)
    elif heatmap_type == "anomaly":
        return generate_anomaly_heatmap(frames)
    raise ValueError(f"Unknown heatmap type: {heatmap_type}")
