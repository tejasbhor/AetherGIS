# AetherGIS v2.0 Architecture

Technical architecture documentation for the AetherGIS GeoAI platform. This document describes the system design, module organization, data flows, and operational characteristics.

---

## 1. System Architecture

### 1.1 Design Philosophy

AetherGIS is built as a **modular monolith** that balances:
- **High-performance GeoAI processing** (GPU-intensive inference)
- **Responsive WebGIS interface** (real-time map interaction)
- **Clean separation** between marketing (Brand) and application (App) concerns
- **Flexible deployment** (local development, Docker production, hybrid)

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                    │
│  │    Brand     │    │     App      │    │   Shared     │                    │
│  │   Module     │───▶│   Module     │◀───│   Module     │                    │
│  │  (Landing)   │    │ (Dashboard)  │    │  (API/Utils) │                    │
│  └──────────────┘    └──────────────┘    └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  FastAPI + Uvicorn                                                           │
│  ├── CORS Middleware                                                         │
│  ├── Security Middleware (HSTS, CSP, Rate Limiting)                          │
│  ├── Request ID Middleware                                                   │
│  └── Route Handlers (8 route modules, 50+ endpoints)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKER LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Celery + Redis                                                              │
│  ├── Pipeline Tasks (GPU-intensive)                                        │
│  │   └── RIFE/FILM interpolation                                           │
│  └── Analytics Tasks (CPU-bound)                                             │
│      └── Heatmaps, change detection, confidence scoring                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Redis   │  │PostgreSQL│  │   Disk   │  │  Caddy   │                   │
│  │ (Queue/  │  │ (Audit/  │  │ (Frames/ │  │(Reverse  │                   │
│  │  Cache)  │  │ History) │  │  Cache)  │  │  Proxy)  │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Module Structure

The frontend uses **strict module boundaries** enforced by TypeScript path aliasing:

```
src/
├── modules/
│   ├── brand/           # Marketing & landing pages
│   │   ├── components/  # EarthScrollScene, BrandFooter, Navbar
│   │   ├── sections/    # Hero, Problem, Solution, CTA
│   │   └── *.tsx        # Page components (About, Product, etc.)
│   ├── app/             # Dashboard application
│   │   ├── components/  # MapViewer, LayerControls, AnalysisPanel
│   │   ├── store/       # Zustand state management
│   │   ├── theme/       # CSS variables, DashboardThemeProvider
│   │   └── hooks/       # Custom React hooks
│   └── shared/          # Common utilities
│       ├── api/         # Typed API client
│       ├── types/       # TypeScript definitions
│       └── utils/       # Helper functions
├── App.tsx              # Root router with module lazy loading
└── index.css            # Global CSS variables (light/dark themes)
```

### 2.2 Path Aliases (Vite)

| Alias | Path | Usage |
|-------|------|-------|
| `@brand` | `src/modules/brand` | Landing pages, marketing |
| `@app` | `src/modules/app` | Dashboard components |
| `@shared` | `src/modules/shared` | API client, types |

### 2.3 State Management

**Zustand store** (`useStore`) manages:
- Job status and pipeline results
- Map state (layers, view, selections)
- UI state (playback, overlays, sidebar)
- Session management

### 2.4 Key Components

| Component | Responsibility |
|-----------|--------------|
| `MapViewer` | OpenLayers map with WMS tile layers |
| `LayerControls` | Left sidebar - layer selection, AOI, time range |
| `AnalysisPanel` | Right sidebar - metrics, analytics, exports |
| `TimelineScrubber` | Bottom playback controls |
| `SessionGate` | Queue management, heartbeat |

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
backend/app/
├── main.py              # Application entry, lifespan management
├── config.py            # Pydantic-settings configuration
├── db.py                # SQLAlchemy database connection
├── api/
│   └── routes/
│       ├── pipeline.py      # Core interpolation endpoints
│       ├── jobs.py          # Async job queue endpoints
│       ├── layers.py        # WMS layer management
│       ├── sessions.py      # Session lock endpoints
│       ├── auth.py          # OAuth/Google Auth
│       ├── analytics.py     # Metrics, cache, system endpoints
│       └── advanced.py      # Confidence, reports, exports
├── services/            # 27 business logic modules
├── tasks/               # Celery task definitions
├── models/              # Pydantic schemas, SQLAlchemy models
├── middleware/          # Security, rate limiting
└── utils/               # Logging, helpers
```

### 3.2 Service Layer (27 Modules)

| Service | Lines | Purpose |
|---------|-------|---------|
| `pipeline.py` | 2,050 | Core orchestration workflow |
| `wms_client.py` | 5,109 | WMS tile fetching, caching |
| `job_manager.py` | 1,667 | Async job lifecycle |
| `report_service.py` | 3,709 | HTML report generation |
| `interpolation.py` | 1,716 | RIFE/FILM engines |
| `satellite_providers.py` | 1,888 | Data source abstraction |
| `layer_capabilities.py` | 1,925 | Layer metadata management |
| `persistence.py` | 1,381 | Data export, SQLite history |
| `video_gen.py` | 883 | FFmpeg MP4 generation |
| `confidence.py` | 839 | Quality scoring |
| `change_anomaly.py` | 999 | Change detection |
| `trajectory_tracker.py` | 384 | Motion vector analysis |
| `heatmap_gen.py` | 415 | Uncertainty visualization |
| `session_lock.py` | 505 | Redis locking |
| `alert_system_v2.py` | 500 | Alert management |
| `explainability_engine.py` | 504 | XAI features |
| `geo_analytics.py` | 1,043 | Spatial statistics |
| `prediction_engine.py` | 384 | Trend prediction |
| `preprocessing.py` | 983 | Data preparation |
| `performance.py` | 428 | System monitoring |
| `temporal_checker.py` | 193 | Gap analysis |
| `time_series_analytics.py` | 401 | Time series metrics |
| `uncertainty_maps.py` | 797 | Uncertainty visualization |
| `tile_cache.py` | 840 | Tile caching layer |

### 3.3 API Route Organization

| Router | Prefix | Endpoints |
|--------|--------|-----------|
| `pipeline` | `/api/v1` | Run, status, results, frames, video |
| `jobs` | `/api/v1` | Async queue, audit, reproduce |
| `layers` | `/api/v1` | WMS layers, capabilities |
| `sessions` | `/api/v1` | Lock, heartbeat, status |
| `auth` | `/api/v1` | Google OAuth, callback |
| `analytics` | `/api/v1` | Cache, metrics, system, streaming |
| `advanced` | `/api/v1` | Confidence, reports, exports, anomalies |

---

## 4. Session Locking System

### 4.1 Problem Statement

GPU resources are scarce. Multiple concurrent interpolation jobs would:
- Exhaust VRAM
- Degrade performance
- Cause out-of-memory errors

### 4.2 Solution: Redis-Backed Exclusive Lock

```python
# session_lock.py
async def acquire_session(user_id: str) -> SessionLock:
    """Attempts to claim exclusive GPU access."""
    
async def release_session(user_id: str) -> None:
    """Releases lock for next user in queue."""
    
async def heartbeat(user_id: str) -> None:
    """Extends lock TTL (called every 30s by frontend)."""
```

### 4.3 Queue Flow

```
User visits /dashboard
        │
        ▼
SessionGate checks Redis
        │
    ┌───┴───┐
    ▼       ▼
Available  Busy
    │       │
    ▼       ▼
Dashboard  Waiting Room
unlocks    (queue position)
    │       │
    ▼       ▼
Heartbeat  Auto-expire
(30s)      (60s TTL)
```

---

## 5. Data Ingestion Pipeline

### 5.1 Provider Hierarchy

```
┌────────────────────────────────────────┐
│         Provider Selection             │
└────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
LocalDisk            NASA GIBS
(offline/)           (WMS API)
    │                    │
    ▼                    ▼
Zero-latency        Cloud fallback
for demos
```

### 5.2 Provider Implementation

```python
# satellite_providers.py
class LocalDiskProvider:
    """Serves from backend/data/offline/ for demos."""
    
class NASA_GIBS_Provider:
    """Primary cloud WMS source."""
    
class ISRO_Bhuvan_Provider:
    """Planned: Indian subcontinent high-res."""
```

---

## 6. Interpolation Pipeline

### 6.1 Pipeline Stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Stage 1 │──▶│  Stage 2 │──▶│  Stage 3 │──▶│  Stage 4 │
│ Ingestion│   │Preprocess│   │Interpolate│  │  Export  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │
Fetch tiles    Normalize      RIFE/FILM      Video, JSON
from WMS       dimensions     inference      report, frames
```

### 6.2 AI Model Registry

| Model | Engine | Use Case | Hardware |
|-------|--------|----------|----------|
| RIFE 4.x | `RIFEEngine` | General interpolation | CUDA/MPS |
| FILM | `FILMEngine` | Large motion (storms) | CUDA/MPS |
| LK Fallback | `LKEngine` | CPU-only fallback | CPU |

### 6.3 Frame Metadata

Each generated frame includes:
- `frame_index`: Position in sequence
- `timestamp`: Temporal position
- `is_interpolated`: True/False
- `model_used`: rife/film/lk
- `confidence_class`: high/medium/low/unknown
- `gap_category`: short/medium/large
- `quality_metrics`: PSNR, SSIM, TCS, FSI

---

## 7. Report Generation System

### 7.1 Report Architecture

```python
# report_service.py
def generate_html_report(
    job_result: PipelineResult,
    trajectories: list,
    alerts: list,
    time_series: dict,
    consistency_issues: list
) -> str:
    """Generates NASA-level technical report."""
```

### 7.2 Report Sections

1. **Executive Summary** — Classification, status, highlights
2. **Run Overview** — Timeline, duration, stage breakdown
3. **Input Summary** — Source, coverage, AOI coordinates
4. **Configuration** — Model params, gap thresholds
5. **Quality Metrics** — PSNR, SSIM, TCS, FSI
6. **Artifact Inventory** — Frame counts by confidence
7. **Anomaly Detection** — Flagged issues with severity
8. **Technical Diagnostics** — Resource usage, timing
9. **Limitations & Caveats** — AI interpolation disclaimers
10. **Traceability** — Full audit trail

### 7.3 Data Flow

```
Pipeline completes
        │
        ▼
Job result stored
        │
        ▼
GET /report requested
        │
        ▼
_report_service.py_
        │
    ┌───┴───┐
    ▼       ▼
Template  Data
assembly  aggregation
    │       │
    └───┬───┘
        ▼
   HTML output
        │
        ▼
   Written to disk
   Returned in response
```

---

## 8. Security Architecture

### 8.1 Environment-Aware Configuration

```python
# config.py
aether_mode: str = 'development'  # or 'production'

# security.py
if settings.aether_mode == 'production':
    enable_hsts()
    enable_csp()
    enable_rate_limiting()
```

### 8.2 Middleware Stack

| Middleware | Purpose | Production Only |
|------------|---------|-----------------|
| CORS | Cross-origin requests | No |
| Request ID | Tracing | No |
| Security | HSTS, CSP, headers | Yes |
| Rate Limit | API abuse prevention | Yes |

---

## 9. Deployment Architecture

### 9.1 Docker Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| caddy | caddy:2-alpine | 80, 443 | Reverse proxy |
| frontend | node:20-alpine | - | Static SPA |
| backend | python:3.11-slim | 8000 | FastAPI API |
| worker | python:3.11-slim | - | Celery worker |
| postgres | postgres:16-alpine | 5432 | Database |
| redis | redis:7-alpine | 6379 | Queue/Cache |

### 9.2 Data Volumes

```yaml
volumes:
  - aethergis_db_data      # PostgreSQL persistence
  - aethergis_redis_data   # Redis AOF
  - aethergis_runs         # Pipeline outputs
  - aethergis_exports      # User downloads
  - aethergis_cache        # WMS tile cache
  - aethergis_logs         # Application logs
```

---

## 10. Development Workflow

### 10.1 Local Development

```
Terminal 1: docker compose up -d redis postgres
Terminal 2: uv run uvicorn backend.app.main:app --reload
Terminal 3: uv run celery -A backend.app.tasks.celery_app worker --loglevel=info -P solo
Terminal 4: cd frontend && npm run dev
```

### 10.2 Smart Setup

```python
# scripts/smart_setup.py
def check_gpu() -> bool:
    """Detects NVIDIA GPU presence."""
    
def update_pyproject(use_gpu: bool):
    """Switches torch between CUDA and CPU sources."""
```

---

## 11. Data Flow Summary

```
USER ACTION                    SYSTEM RESPONSE
───────────                    ───────────────
Select layer            ──▶    Fetch capabilities
                        ◀──    Return DOM entries
                        
Set AOI/time range      ──▶    Validate bounds
                        ◀──    Enable run button
                        
Click Run Pipeline      ──▶    Create job record
                        │      Submit Celery task
                        ◀──    Return job_id
                        
Poll /status/{id}       ──▶    Check Celery state
                        ◀──    progress%, stage, ETA
                        
Pipeline completes      ──▶    Store results
                        │      Generate report
                        ◀──    Notify frontend
                        
Request /report/{id}    ──▶    Generate HTML
                        ◀──    Return styled report
```

---

## 12. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.4 |
| Frontend | Vite | 8.0.1 |
| Frontend | TypeScript | 5.9.3 |
| Frontend | OpenLayers | 10.8.0 |
| Frontend | Zustand | 5.0.12 |
| Frontend | Framer Motion | 11.18.2 |
| Backend | Python | 3.11+ |
| Backend | FastAPI | 0.111.0 |
| Backend | Celery | 5.4.0 |
| Backend | SQLAlchemy | 2.0.36 |
| Backend | PyTorch | 2.0.0+ |
| Database | PostgreSQL | 16 |
| Queue | Redis | 7 |
| Proxy | Caddy | 2.x |
| Build | uv | latest |

---

## 13. Testing Architecture

### 13.1 Test Organization

```
backend/tests/
├── test_confidence.py           # Frame quality scoring algorithms
├── test_preprocessing.py        # Temporal gap detection, deduplication
├── test_production_modules.py   # Integration tests for all modules
├── test_session_lock.py         # Redis-backed session locking (security)
├── test_auth.py                 # OAuth flow and authentication (security)
├── test_api_pipeline.py         # Pipeline API endpoints
├── test_api_sessions.py         # Sessions API endpoints
├── test_health.py               # Health check endpoint
├── test_wms_client.py          # WMS tile fetching
├── test_film_engine.py         # AI model loading
├── test_mosdac.py              # MOSDAC provider integration
├── test_access_controls.py     # Permission system
└── __init__.py
```

### 13.2 Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Security** | `test_session_lock.py`, `test_auth.py` | GPU locking, OAuth flow |
| **Core Logic** | `test_confidence.py`, `test_preprocessing.py` | Frame quality, gap detection |
| **API** | `test_api_*.py` | FastAPI endpoint validation |
| **Integration** | `test_production_modules.py` | End-to-end workflows |
| **Providers** | `test_wms_client.py`, `test_mosdac.py` | External service integration |

### 13.3 Security Test Coverage

| Component | Test File | Coverage |
|-----------|-----------|----------|
| Session Lock | `test_session_lock.py` | Lock acquisition, queue, heartbeat, release |
| Auth Callback | `test_auth.py` | Mock code rejection, cookie security |
| Rate Limiting | `test_api_pipeline.py` | 429 responses |
| Input Validation | `test_api_pipeline.py` | Schema validation, bbox bounds |

### 13.4 Running Tests

```bash
# All tests
uv run pytest backend/tests -v

# Security tests only
uv run pytest backend/tests/test_session_lock.py backend/tests/test_auth.py -v

# API tests
uv run pytest backend/tests/test_api_*.py -v

# With coverage report
uv run pytest backend/tests --cov=backend/app --cov-report=html
```

---

## 14. Recent Improvements (Backend Audit)

### 14.1 Security Fixes
- **Auth bypass fix**: `/me` endpoint now requires explicit mock token in dev mode
- **Rate limiting**: Added to production mode on all API endpoints
- **Session locking**: Redis-backed exclusive GPU access with heartbeat mechanism

### 14.2 Performance Improvements
- **Health check**: Connection pooling for Redis (reuses connections)
- **Database sessions**: Proper cleanup with `try/finally` blocks
- **GPU detection**: Cached checks with exception handling

### 14.3 Test Additions
- 68 new tests added across 5 new test files
- Focus on security-critical paths (session lock, authentication)
- API endpoint validation tests
- Health endpoint performance tests

---

*Last updated: 2026-04-28*
