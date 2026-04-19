"""AetherGIS Backend - Configuration (pydantic-settings)"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    api_host: str = '0.0.0.0'
    api_port: int = 8000
    log_level: str = 'INFO'
    cors_origins: list[str] = ['http://localhost:5173', 'http://localhost:3000']

    nasa_gibs_base_url: str = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
    nasa_gibs_wmts_url: str = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi'
    nasa_gibs_api_key: str = ''

    bhuvan_wms_url: str = 'https://bhuvan-ras2.nrsc.gov.in/bhuvan/wms'
    bhuvan_api_key: str = ''

    redis_url: str = 'redis://localhost:6379/0'
    celery_broker_url: str = 'redis://localhost:6379/0'
    celery_result_backend: str = 'redis://localhost:6379/1'

    # ── Storage paths anchored to this file so CWD doesn't matter ──────────
    # config.py lives at  backend/app/config.py
    # _BACKEND_ROOT        backend/
    # _PROJECT_ROOT        project root (Major Project/)
    _BACKEND_ROOT: Path = Path(__file__).resolve().parent.parent
    _PROJECT_ROOT: Path = _BACKEND_ROOT.parent

    data_dir: Path = _BACKEND_ROOT / 'data'
    exports_dir: Path = _BACKEND_ROOT / 'data' / 'exports'
    cache_dir: Path = _BACKEND_ROOT / 'data' / 'cache'
    ai_models_dir: Path = _BACKEND_ROOT / 'app' / 'ai_models'

    cuda_device: str = 'cuda'
    rife_model_path: Path = Path(__file__).parent.parent / 'app' / 'ai_models' / 'rife' / 'flownet.pkl'
    film_model_path: Path = Path(__file__).parent.parent / 'app' / 'ai_models' / 'film' / 'film_net_fp32.pt'
    inference_timeout_seconds: int = 60

    wms_rate_limit_delay: float = 1.0
    wms_max_retries: int = 3
    wms_timeout_seconds: int = 30
    max_frames_per_session: int = 48
    max_image_resolution: int = 2048

    flow_consistency_threshold: float = 0.15
    flow_rejection_threshold: float = 0.40
    large_diff_threshold: float = 0.30
    min_bbox_area: float = 0.01

    cs_weight_flow: float = 0.40
    cs_weight_mad: float = 0.35
    cs_weight_gap: float = 0.25

    high_confidence_threshold: float = 0.75
    medium_confidence_threshold: float = 0.45

    gap_short_max: float = 15.0
    gap_medium_max: float = 30.0
    gap_large_max: float = 60.0

    # ── Production v2 settings ───────────────────────────────────────────────
    # MODULE 12 — Security
    api_keys: list[str] = []                       # empty = no auth required
    rate_limit_requests_per_minute: int = 120

    # MODULE 4 — Cache
    tile_cache_ttl_seconds: int = 3600
    tile_cache_max_memory_items: int = 256

    # MODULE 8 — Anomaly detection
    anomaly_threshold: float = 0.50

    # MODULE 3 — Providers
    himawari_wms_url: str = 'https://www.eorc.jaxa.jp/ptree/himawari-8/api'
    mosdac_wms_url: str = 'https://mosdac.gov.in/live/wms'

    def ensure_dirs(self) -> None:
        for directory in [
            self.data_dir, self.exports_dir, self.cache_dir, self.ai_models_dir,
            self.data_dir / "runs",
            self.data_dir / "audit",
            self.data_dir / "checkpoints",
            self.data_dir / "metrics",
        ]:
            directory.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
