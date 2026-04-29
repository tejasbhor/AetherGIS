"""AetherGIS â€” Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class DataSource(str, Enum):
    nasa_gibs = "nasa_gibs"
    isro_bhuvan = "isro_bhuvan"
    insat = "insat"


class InterpolationModel(str, Enum):
    rife = "rife"
    film = "film"
    dain = "dain"
    lk_fallback = "lk_fallback"


class Resolution(int, Enum):
    low = 512
    medium = 1024
    high = 2048


class ConfidenceClass(str, Enum):
    high = "HIGH"
    medium = "MEDIUM"
    low = "LOW"
    rejected = "REJECTED"


class JobStatus(str, Enum):
    queued = "QUEUED"
    running = "RUNNING"
    completed = "COMPLETED"
    failed = "FAILED"


class GapCategory(str, Enum):
    short = "SHORT"       # < 15 min
    medium = "MEDIUM"     # 15â€“30 min
    large = "LARGE"       # 30â€“60 min
    very_large = "VERY_LARGE"  # > 60 min


# â”€â”€ Request Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PipelineRunRequest(BaseModel):
    """POST /api/v1/pipeline/run â€” submit a pipeline job."""
    data_source: DataSource = DataSource.nasa_gibs
    layer_id: str = Field(..., examples=["GOES-East_ABI_Band2_Red_Visible_1km"])
    bbox: list[float] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="[minLon, minLat, maxLon, maxLat]",
        examples=[[68.18, 8.07, 97.42, 37.09]],
    )
    time_start: datetime
    time_end: datetime
    resolution: Resolution = Resolution.medium
    interpolation_model: InterpolationModel = InterpolationModel.rife
    n_intermediate: int = Field(default=4, ge=1, le=8)
    step_minutes: Optional[int] = Field(None, ge=1, le=1440)
    include_low_confidence: bool = False
    session_id: Optional[str] = None
    session_name: Optional[str] = "Untitled Session"

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, v: list[float]) -> list[float]:
        if v[0] >= v[2] or v[1] >= v[3]:
            raise ValueError("bbox must be [minLon, minLat, maxLon, maxLat] with min < max")
        if (v[2] - v[0]) * (v[3] - v[1]) < 0.01:
            raise ValueError("bbox area too small â€” expand the region of interest")
        return v

    @field_validator("time_end")
    @classmethod
    def validate_time_range(cls, v: datetime, info: Any) -> datetime:
        if "time_start" in info.data and v <= info.data["time_start"]:
            raise ValueError("time_end must be after time_start")
        return v


# â”€â”€ Frame-Level Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class FrameMetadata(BaseModel):
    frame_index: int
    timestamp: datetime
    is_interpolated: bool
    confidence_score: Optional[float] = None
    confidence_class: Optional[ConfidenceClass] = None
    model_used: Optional[str] = None
    flow_consistency: Optional[float] = None
    mad_score: Optional[float] = None
    gap_minutes: Optional[float] = None
    gap_category: Optional[GapCategory] = None
    psnr: Optional[float] = None
    ssim: Optional[float] = None
    provider_source: Optional[str] = None


# â”€â”€ Quality Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class QualityMetrics(BaseModel):
    tcs: Optional[float] = Field(None, description="Temporal Consistency Score")
    fsi: Optional[float] = Field(None, description="Frame Stability Index")
    avg_psnr: Optional[float] = None
    avg_ssim: Optional[float] = None
    high_confidence_count: int = 0
    medium_confidence_count: int = 0
    low_confidence_count: int = 0
    rejected_count: int = 0
    total_frames: int = 0
    interpolated_frames: int = 0
    observed_frames: int = 0


# â”€â”€ Pipeline Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PipelineResult(BaseModel):
    job_id: str
    status: JobStatus
    layer_id: str
    data_source: DataSource
    bbox: list[float]
    time_start: datetime
    time_end: datetime
    original_video_url: Optional[str] = None
    interpolated_video_url: Optional[str] = None
    frames: list[FrameMetadata] = []
    metrics: Optional[QualityMetrics] = None
    trajectories: list[dict] = []
    alerts: list[dict] = []
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


# â”€â”€ Job Status Response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: Optional[float] = Field(None, ge=0, le=1)
    message: Optional[str] = None
    error: Optional[str] = None


# â”€â”€ Layer Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class LayerInfo(BaseModel):
    layer_id: str
    name: str
    temporal_resolution_minutes: float
    data_source: DataSource
    use_case: str
    crs: str = "EPSG:4326"
    available_formats: list[str] = ["image/png"]
    description: Optional[str] = None
    nadir_lon: Optional[float] = None
    coverage_lon_min: Optional[float] = None
    coverage_lon_max: Optional[float] = None
    coverage_lat_min: Optional[float] = None
    coverage_lat_max: Optional[float] = None
    coverage_note: Optional[str] = None
    preset_regions: dict[str, dict[str, Any]] = Field(default_factory=dict)
    default_preset: Optional[str] = None


class LayerCapabilities(BaseModel):
    layer_id: str
    time_start: Optional[datetime] = None
    time_end: Optional[datetime] = None
    latest_available_time: Optional[datetime] = None
    suggested_time_start: Optional[datetime] = None
    suggested_time_end: Optional[datetime] = None
    step_minutes: Optional[int] = None
    time_source_live: bool = False
    temporal_resolution_minutes: float
    min_resolution: int = 256
    max_resolution: int = 2048
    bbox: list[float] = [-180, -90, 180, 90]
    nadir_lon: Optional[float] = None
    coverage_lon_min: Optional[float] = None
    coverage_lon_max: Optional[float] = None
    coverage_lat_min: Optional[float] = None
    coverage_lat_max: Optional[float] = None
    coverage_note: Optional[str] = None
    default_preset: Optional[str] = None


# â”€â”€ Session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class SessionCreateRequest(BaseModel):
    data_source: DataSource = DataSource.nasa_gibs


class SessionResponse(BaseModel):
    session_id: str
    data_source: DataSource
    created_at: datetime


class SessionSummaryResponse(BaseModel):
    session_id: str
    name: str
    provider_default: str
    user_id: Optional[str] = None
    run_count: int = 0
    created_at: datetime
    updated_at: datetime
    last_run_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None


class SessionCreateV2Request(BaseModel):
    name: str
    provider_default: DataSource = DataSource.nasa_gibs


class SessionRenameRequest(BaseModel):
    name: str


# â”€â”€ Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class HealthResponse(BaseModel):
    status: str
    redis_connected: bool
    db_connected: bool = True          # was missing — caused false SERVICE DEGRADED banners
    gpu_available: bool
    gpu_device_name: Optional[str] = None
    rife_model_loaded: bool
    film_model_loaded: bool = False
    # True when DL weights are absent but LK optical flow fallback is active.
    # Infrastructure is healthy; pipeline output is valid.
    cpu_fallback_mode: bool = False
    version: str = "2.0.0"






# ── Production v2 Schemas ─────────────────────────────────────────────────────

class JobPriorityEnum(str, Enum):
    high = "high"
    normal = "normal"
    low = "low"


class ProviderInfo(BaseModel):
    name: str
    priority: int


class CacheStatusResponse(BaseModel):
    l1_memory: dict
    l2_redis: dict
    default_ttl_seconds: int
    rapid_layer_ttl_seconds: int
    static_layer_ttl_seconds: int


class RegionQueryRequest(BaseModel):
    job_id: str
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    time_start: datetime
    time_end: datetime


class RegionStatsResponse(BaseModel):
    job_id: str
    query_bbox: list[float]
    time_range_start: str
    time_range_end: str
    total_frames: int
    frames_in_region: int
    avg_motion_magnitude: float
    cloud_coverage_pct: float
    avg_brightness: float
    avg_confidence: Optional[float]
    anomaly_count: int
    computed_at: str


class GlobalMetricsResponse(BaseModel):
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    total_frames_generated: int
    total_interpolated_frames: int
    avg_psnr: Optional[float]
    avg_ssim: Optional[float]
    avg_confidence: Optional[float]
    rejection_rate: float
    anomaly_rate: float
    last_updated: str


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    type: str
    priority: int
    gpu_required: bool
    fallback_to: Optional[str]
    loaded: Optional[bool]


class AnomalyFrameResult(BaseModel):
    frame_index: int
    label: str  # NORMAL | ANOMALY
    anomaly_score: float
    intensity_spike: bool
    motion_anomaly: bool
    structure_anomaly: bool
    details: dict


class AnomalyReportResponse(BaseModel):
    job_id: str
    total_frames: int
    anomaly_count: int
    normal_count: int
    frames: list[AnomalyFrameResult]


class SystemPerformanceResponse(BaseModel):
    timestamp: str
    gpu: dict
    cpu: dict
    memory: dict
    active_jobs: int
    queued_jobs: int
    frames_processed_last_hour: int
    avg_job_duration_sec: Optional[float]


class JobLogEntry(BaseModel):
    ts: str
    msg: str
    progress: float
    stage: str


class JobV2StatusResponse(BaseModel):
    job_id: str
    status: str
    priority: str
    progress: float
    current_stage: str
    stage_index: int
    queue_position: int
    estimated_completion: Optional[str]
    message: Optional[str]
    error: Optional[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]


class RunSummaryResponse(BaseModel):
    run_id: str
    job_id: str
    session_id: str
    user_id: Optional[str] = None
    provider: str
    status: str
    priority: str
    layer_id: str
    bbox: list[float]
    time_start: datetime
    time_end: datetime
    resolution: int
    interpolation_model: str
    n_intermediate: int = 4
    step_minutes: Optional[int] = None
    include_low_confidence: bool = False
    params: dict = {}
    metrics: dict = {}
    manifest: dict = {}
    result: Optional[dict] = None
    error_message: Optional[str] = None
    current_stage: Optional[str] = None
    progress: float = 0.0
    message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
