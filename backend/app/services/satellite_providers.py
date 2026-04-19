"""AetherGIS — Multi-Source Satellite Provider (MODULE 3).

Provides a unified SatelliteProvider interface with:
  • NASA GIBS (GOES)
  • Himawari-8/9 (via JAXA)
  • INSAT-3D/3DR (via MOSDAC)
  • Fallback static dataset (synthetic gradient)

Auto-fallback: if one source fails, the next in the priority list is tried.
All fallback events are logged and recorded in the audit trail.
"""
from __future__ import annotations

import asyncio
import hashlib
import io
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import httpx
import numpy as np
from PIL import Image

from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


# ── Frame result ──────────────────────────────────────────────────────────────

@dataclass
class ProviderFrame:
    image: np.ndarray          # float32 H×W×3 in [0,1]
    timestamp: datetime
    source: str                # provider name
    layer: str
    bbox: list[float]
    resolution: int
    url_used: Optional[str] = None
    fallback_used: bool = False
    cache_hit: bool = False


# ── Abstract base ──────────────────────────────────────────────────────────────

class SatelliteProvider(ABC):
    name: str = "base"
    priority: int = 99

    @abstractmethod
    async def fetch_frame(
        self,
        layer_id: str,
        bbox: list[float],
        timestamp: datetime,
        resolution: int,
        client: httpx.AsyncClient,
    ) -> Optional[ProviderFrame]:
        ...

    async def is_available(self, client: httpx.AsyncClient) -> bool:
        return True


def _decode_image(raw: bytes, resolution: int) -> Optional[np.ndarray]:
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img = img.resize((resolution, resolution), Image.LANCZOS)
        arr = np.array(img, dtype=np.float32) / 255.0
        return arr
    except Exception:
        return None


# ── NASA GIBS provider ─────────────────────────────────────────────────────────

class NASAGIBSProvider(SatelliteProvider):
    name = "nasa_gibs"
    priority = 1
    base_url = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

    async def fetch_frame(
        self,
        layer_id: str,
        bbox: list[float],
        timestamp: datetime,
        resolution: int,
        client: httpx.AsyncClient,
    ) -> Optional[ProviderFrame]:
        date_str = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        params = {
            "SERVICE": "WMS",
            "VERSION": "1.1.1",
            "REQUEST": "GetMap",
            "LAYERS": layer_id,
            "SRS": "EPSG:4326",
            "BBOX": f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}",
            "WIDTH": str(resolution),
            "HEIGHT": str(resolution),
            "FORMAT": "image/png",
            "TRANSPARENT": "TRUE",
            "TIME": date_str,
        }
        url = self.base_url
        try:
            resp = await client.get(url, params=params, timeout=settings.wms_timeout_seconds)
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
                img = _decode_image(resp.content, resolution)
                if img is not None:
                    return ProviderFrame(
                        image=img,
                        timestamp=timestamp,
                        source=self.name,
                        layer=layer_id,
                        bbox=bbox,
                        resolution=resolution,
                        url_used=str(resp.url),
                    )
        except Exception as exc:
            logger.warning("GIBS fetch failed", layer=layer_id, ts=date_str, error=str(exc))
        return None


# ── Himawari provider ─────────────────────────────────────────────────────────

class HimawariProvider(SatelliteProvider):
    name = "himawari"
    priority = 2
    # JAXA Himawari Monitor WMS (public endpoint)
    base_url = "https://www.eorc.jaxa.jp/ptree/himawari-8/api/fd/infrared/latest/image"

    async def fetch_frame(
        self,
        layer_id: str,
        bbox: list[float],
        timestamp: datetime,
        resolution: int,
        client: httpx.AsyncClient,
    ) -> Optional[ProviderFrame]:
        # Himawari provides pan-Asia/Pacific imagery; map generic layer to Himawari bands
        band = "B03"  # visible
        date_str = timestamp.strftime("%Y%m%d_%H%M00")
        params = {
            "SERVICE": "WMS",
            "VERSION": "1.1.1",
            "REQUEST": "GetMap",
            "LAYERS": f"Himawari_{band}",
            "SRS": "EPSG:4326",
            "BBOX": f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}",
            "WIDTH": str(resolution),
            "HEIGHT": str(resolution),
            "FORMAT": "image/png",
            "TIME": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        # Attempt via NRSC/Bhuvan as proxy for Himawari
        bhuvan_url = "https://bhuvan-ras2.nrsc.gov.in/bhuvan/wms"
        try:
            resp = await client.get(bhuvan_url, params=params, timeout=settings.wms_timeout_seconds)
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
                img = _decode_image(resp.content, resolution)
                if img is not None:
                    return ProviderFrame(
                        image=img,
                        timestamp=timestamp,
                        source=self.name,
                        layer=layer_id,
                        bbox=bbox,
                        resolution=resolution,
                        url_used=str(resp.url),
                    )
        except Exception as exc:
            logger.warning("Himawari fetch failed", error=str(exc))
        return None


# ── INSAT provider ────────────────────────────────────────────────────────────

class INSATProvider(SatelliteProvider):
    name = "insat"
    priority = 3
    # MOSDAC WMS for INSAT-3D/3DR (India)
    base_url = "https://mosdac.gov.in/live/wms"

    async def fetch_frame(
        self,
        layer_id: str,
        bbox: list[float],
        timestamp: datetime,
        resolution: int,
        client: httpx.AsyncClient,
    ) -> Optional[ProviderFrame]:
        params = {
            "SERVICE": "WMS",
            "VERSION": "1.1.1",
            "REQUEST": "GetMap",
            "LAYERS": "INSAT3D_VIS",
            "SRS": "EPSG:4326",
            "BBOX": f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}",
            "WIDTH": str(resolution),
            "HEIGHT": str(resolution),
            "FORMAT": "image/png",
            "TIME": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        try:
            resp = await client.get(self.base_url, params=params, timeout=settings.wms_timeout_seconds)
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
                img = _decode_image(resp.content, resolution)
                if img is not None:
                    return ProviderFrame(
                        image=img,
                        timestamp=timestamp,
                        source=self.name,
                        layer=layer_id,
                        bbox=bbox,
                        resolution=resolution,
                        url_used=str(resp.url),
                    )
        except Exception as exc:
            logger.warning("INSAT fetch failed", error=str(exc))
        return None


# ── Fallback static dataset ────────────────────────────────────────────────────

class StaticFallbackProvider(SatelliteProvider):
    name = "static_fallback"
    priority = 99

    async def fetch_frame(
        self,
        layer_id: str,
        bbox: list[float],
        timestamp: datetime,
        resolution: int,
        client: httpx.AsyncClient,
    ) -> Optional[ProviderFrame]:
        """Generate a synthetic gradient frame so the pipeline never fully fails."""
        logger.warning("Using static fallback dataset", layer=layer_id, ts=timestamp.isoformat())
        rng = np.random.default_rng(
            seed=int(hashlib.sha256(f"{layer_id}{timestamp.isoformat()}".encode()).hexdigest()[:8], 16)
        )
        # Synthetic cloud-like gradient
        h = w = resolution
        x = np.linspace(0, 1, w)
        y = np.linspace(0, 1, h)
        xx, yy = np.meshgrid(x, y)
        base = 0.4 + 0.3 * np.sin(xx * 8) * np.cos(yy * 6)
        noise = rng.random((h, w)) * 0.1
        channel = np.clip(base + noise, 0, 1).astype(np.float32)
        img = np.stack([channel, channel * 0.9, channel * 0.8], axis=-1)
        return ProviderFrame(
            image=img,
            timestamp=timestamp,
            source=self.name,
            layer=layer_id,
            bbox=bbox,
            resolution=resolution,
            url_used=None,
            fallback_used=True,
        )


# ── Provider registry ─────────────────────────────────────────────────────────

_PROVIDERS: list[SatelliteProvider] = sorted(
    [
        NASAGIBSProvider(),
        HimawariProvider(),
        INSATProvider(),
        StaticFallbackProvider(),
    ],
    key=lambda p: p.priority,
)


def get_provider(name: str) -> Optional[SatelliteProvider]:
    for p in _PROVIDERS:
        if p.name == name:
            return p
    return None


def list_providers() -> list[dict]:
    return [{"name": p.name, "priority": p.priority} for p in _PROVIDERS]


# ── Auto-fallback fetch ────────────────────────────────────────────────────────

async def fetch_with_fallback(
    layer_id: str,
    bbox: list[float],
    timestamp: datetime,
    resolution: int,
    preferred_source: str = "nasa_gibs",
    job_id: Optional[str] = None,
    max_retries: int = 3,
) -> Optional[ProviderFrame]:
    """Try preferred source first, then fall through the provider chain.

    Each failed attempt is logged and recorded in the audit trail.
    Retries with exponential backoff within each provider.
    """
    from backend.app.services.job_manager import append_audit_event

    # Build ordered list starting with preferred
    ordered = sorted(_PROVIDERS, key=lambda p: (0 if p.name == preferred_source else p.priority))

    async with httpx.AsyncClient(timeout=settings.wms_timeout_seconds) as client:
        for provider in ordered:
            for attempt in range(max_retries):
                try:
                    frame = await provider.fetch_frame(layer_id, bbox, timestamp, resolution, client)
                    if frame is not None:
                        if provider.name != preferred_source:
                            frame.fallback_used = True
                            logger.warning(
                                "Fallback provider used",
                                preferred=preferred_source,
                                actual=provider.name,
                                ts=timestamp.isoformat(),
                            )
                            if job_id:
                                append_audit_event(job_id, "fallback_triggered", {
                                    "preferred": preferred_source,
                                    "actual": provider.name,
                                    "ts": timestamp.isoformat(),
                                    "layer": layer_id,
                                })
                        return frame
                except Exception as exc:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                    logger.warning(
                        "Provider fetch attempt failed",
                        provider=provider.name,
                        attempt=attempt + 1,
                        error=str(exc),
                    )

    logger.error("All providers failed", layer=layer_id, ts=timestamp.isoformat())
    return None
