# AetherGIS v2.0 — Production-Grade GeoAI Platform

AI-Based Temporal Enhancement & WebGIS Visualization System for Satellite Imagery.

> **Disclaimer**: All interpolated frames are visual approximations and are **NOT** suitable for scientific measurement or quantitative analysis.

---

## What's New in v2.0

v2.0 transforms AetherGIS from a working pipeline into a **production-grade GeoAI platform** by adding 15 backend modules:

| Module | Capability | Key Endpoints |
|--------|-----------|---------------|
| 1 | Async Job Engine + Queue | `POST /api/v1/jobs`, `GET .../status`, `GET .../logs`, `POST .../cancel` |
| 2 | Data Versioning + Reproducibility | `GET /api/v1/jobs/{id}/reproduce` |
| 3 | Multi-Source Ingestion | Auto-fallback: GIBS → Himawari → INSAT → Static |
| 4 | Smart Cache + Tile Store | `GET /api/v1/cache/status`, `POST /api/v1/cache/clear` |
| 5 | Advanced Interpolation Registry | `GET /api/v1/models` |
| 6 | Uncertainty Map Generation | `GET /api/v1/jobs/{id}/confidence_map/{frame}` |
| 7 | Change Detection Engine | `GET /api/v1/jobs/{id}/change_map/{frame}`, `.../change_stats` |
| 8 | Anomaly Detection | `GET /api/v1/jobs/{id}/anomaly_report` |
| 9 | Geo-Region Query Engine | `POST /api/v1/region/query` |
| 10 | Metric Aggregation Dashboard | `GET /api/v1/metrics/summary` |
| 11 | Streaming Frame Delivery | `GET /api/v1/jobs/{id}/stream` (SSE) |
| 12 | Security + Rate Limiting | API key auth, per-IP sliding window |
| 13 | Failure Recovery | Retry with exponential backoff, stage checkpointing |
| 14 | Performance Optimization | `GET /api/v1/system/performance` |
| 15 | Full Audit Trail | `GET /api/v1/jobs/{id}/audit` |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FastAPI (port 8000)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ /jobs    │ │ /cache   │ │ /region  │ │ /system│ │
│  │ /models  │ │ /metrics │ │ /stream  │ │ /layers│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Redis   │  │  Celery  │  │  Celery  │
   │ (broker/ │  │ Worker   │  │ Worker   │
   │  cache/  │  │  HIGH    │  │ NORMAL/  │
   │rate-limit│  │  (GPU)   │  │  LOW     │
   └──────────┘  └──────────┘  └──────────┘
                       │
         ┌─────────────┼──────────────────┐
         ▼             ▼                  ▼
  ┌────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Satellite  │ │ Interpolation│ │  Analytics   │
  │ Providers  │ │   Engine     │ │   Engine     │
  │ NASA GIBS  │ │ RIFE / FILM  │ │ Uncertainty  │
  │ Himawari   │ │ Optical Flow │ │ Change Det.  │
  │ INSAT      │ │              │ │ Anomaly Det. │
  │ Fallback   │ │              │ │              │
  └────────────┘ └──────────────┘ └──────────────┘
```

---

## Quick Start

### 1. Start all services

```bash
docker-compose up -d
```

This starts:
- `redis` — job queue, tile cache, rate limiting
- `api` — FastAPI on port 8000
- `celery_worker_high` — GPU worker for high-priority jobs
- `celery_worker_normal` — CPU workers for normal/low jobs
- `celery_beat` — periodic task scheduler
- `flower` — Celery monitoring UI on port 5555

### 2. Submit a job

```bash
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "layer_id": "GOES-East_ABI_Band2_Red_Visible_1km",
    "data_source": "nasa_gibs",
    "bbox": [68.18, 8.07, 97.42, 37.09],
    "time_start": "2024-06-01T06:00:00Z",
    "time_end": "2024-06-01T12:00:00Z",
    "resolution": 1024,
    "interpolation_model": "rife",
    "n_intermediate": 4,
    "priority": "high"
  }'
```

Response:
```json
{
  "job_id": "3f4a1b2c-...",
  "status": "QUEUED",
  "priority": "high",
  "queue_position": 1,
  "estimated_completion": "2024-06-01T12:02:30Z"
}
```

### 3. Poll status

```bash
curl http://localhost:8000/api/v1/jobs/3f4a1b2c-.../status
```

```json
{
  "job_id": "3f4a1b2c-...",
  "status": "RUNNING",
  "priority": "high",
  "progress": 0.62,
  "current_stage": "interpolation",
  "stage_index": 3,
  "queue_position": 0,
  "estimated_completion": "2024-06-01T12:01:45Z",
  "message": "Interpolating pair 4 of 7"
}
```

### 4. Stream frames via SSE

```javascript
const source = new EventSource('/api/v1/jobs/3f4a1b2c-.../stream');
source.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'frame') {
    // msg.data is base64 PNG
    img.src = `data:image/png;base64,${msg.data}`;
  }
};
```

---

## API Reference

### Jobs (MODULE 1 + 2 + 15)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/jobs` | Submit job with priority |
| `GET` | `/api/v1/jobs/{id}/status` | Status, stage, ETA, queue position |
| `GET` | `/api/v1/jobs/{id}/logs` | Structured log stream |
| `POST` | `/api/v1/jobs/{id}/cancel` | Cancel queued/running job |
| `GET` | `/api/v1/jobs/{id}/reproduce` | Reproducibility manifest |
| `GET` | `/api/v1/jobs/{id}/audit` | Full audit trail |

### Analytics (MODULES 6–9)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/jobs/{id}/confidence_map/{frame}` | Pixel-wise uncertainty heatmap |
| `GET` | `/api/v1/jobs/{id}/change_map/{frame}` | Frame-to-frame change detection |
| `GET` | `/api/v1/jobs/{id}/change_stats` | Change statistics for all frames |
| `GET` | `/api/v1/jobs/{id}/anomaly_report` | Anomaly detection results |
| `GET` | `/api/v1/jobs/{id}/stream` | SSE frame streaming |
| `POST` | `/api/v1/region/query` | Geo-region spatial statistics |

### System (MODULES 4, 5, 10, 14)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/cache/status` | L1 + L2 cache metrics |
| `POST` | `/api/v1/cache/clear` | Invalidate cache |
| `GET` | `/api/v1/models` | Interpolation model registry |
| `GET` | `/api/v1/metrics/summary` | Global aggregated metrics |
| `GET` | `/api/v1/system/performance` | GPU / CPU / RAM / queue |
| `GET` | `/api/v1/system/providers` | Satellite provider list |

---

## Uncertainty Maps (MODULE 6)

Each interpolated frame gets a `confidence_map_{N}.png` heatmap:

- **Green pixels** → high confidence (low uncertainty)
- **Red pixels** → low confidence (high uncertainty)

Uncertainty is computed from three signals weighted together:
1. **Flow inconsistency** (40%) — forward/backward optical flow divergence
2. **Intensity error** (35%) — deviation from expected linear blend
3. **Interpolation variance** (25%) — variance across neighboring frames

---

## Anomaly Detection (MODULE 8)

Each frame is scored and labelled `NORMAL` or `ANOMALY`. Signals:

| Signal | Weight | Detects |
|--------|--------|---------|
| Intensity spike | 40% | Sudden brightness changes |
| Motion anomaly | 35% | Inconsistent movement vs history |
| Structure anomaly | 25% | Blank regions, saturation, artefacts |

---

## Reproducibility (MODULE 2)

Every job stores a `manifest.json` containing:
- Exact WMS URLs used
- Timestamps of every ingested frame
- Model name + weight hash (first 1MB SHA-256)
- All preprocessing parameters
- Complete config snapshot

Retrieve it any time: `GET /api/v1/jobs/{id}/reproduce`

---

## Configuration

Key `.env` variables for v2:

```env
# Security (MODULE 12)
API_KEYS=["key1","key2"]          # empty = no auth
RATE_LIMIT_REQUESTS_PER_MINUTE=120

# Cache (MODULE 4)
TILE_CACHE_TTL_SECONDS=3600
TILE_CACHE_MAX_MEMORY_ITEMS=256

# Anomaly detection (MODULE 8)
ANOMALY_THRESHOLD=0.50

# Satellite providers (MODULE 3)
NASA_GIBS_BASE_URL=https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
BHUVAN_WMS_URL=https://bhuvan-ras2.nrsc.gov.in/bhuvan/wms

# Failure recovery (MODULE 13)
WMS_MAX_RETRIES=3
```

---

## Development

```bash
# Run tests
pytest backend/tests/ -v

# Run only new module tests
pytest backend/tests/test_production_modules.py -v

# Run API server locally (requires Redis)
uvicorn backend.app.main:app --reload --port 8000

# Run Celery worker locally
celery -A backend.app.tasks.celery_app.celery_app worker --loglevel=info
```

---

## Data Layout

```
backend/data/
├── runs/
│   └── {job_id}/
│       └── manifest.json          # MODULE 2 — reproducibility
├── audit/
│   └── {job_id}.json              # MODULE 15 — full audit trail
├── checkpoints/
│   └── {job_id}/
│       ├── ingestion.json          # MODULE 13 — failure recovery
│       ├── preprocessing.json
│       └── interpolation.json
├── metrics/
│   └── global.json                 # MODULE 10 — global aggregation
├── exports/
│   └── {job_id}/
│       ├── frames/frame_*.png
│       ├── metadata.json
│       ├── confidence_maps/        # MODULE 6
│       │   └── confidence_map_*.png
│       └── change_maps/            # MODULE 7
│           └── change_map_*.png
└── cache/                          # MODULE 4 — tile cache (disk tier)
```
