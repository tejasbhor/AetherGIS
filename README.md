# AetherGIS v2.0 — Production-Grade GeoAI Platform

AI-Based Temporal Enhancement & WebGIS Visualization System for Satellite Imagery.

[![Architecture](https://img.shields.io/badge/Architecture-Modular_Monolith-blue)](./ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](./DEVELOPER_GUIDE.md)

---

## 🚀 Overview

AetherGIS v2.0 is a comprehensive platform for high-resolution temporal interpolation of satellite imagery. It leverages advanced AI models (RIFE/FILM) to generate smooth intermediate frames between sparse satellite captures, enabling fluid visualization of meteorological events, cloud motion, and environmental changes.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **AI Interpolation** | RIFE 4.x and Google FILM engines for temporal frame generation |
| **Multi-Source Data** | NASA GIBS (primary), LocalDisk (offline demos), ISRO Bhuvan (planned) |
| **Session Management** | Redis-backed exclusive locks with heartbeat mechanism |
| **Analytics Engine** | Uncertainty heatmaps, change detection, anomaly detection, trajectory tracking |
| **Report Generation** | NASA-level HTML technical reports with full audit trails |
| **Video Export** | MP4 generation with quality metrics and frame metadata |

### System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Brand     │────▶│    App      │◀────│   Shared    │
│   Module    │     │   Module    │     │   Module    │
│  (Landing)  │     │ (Dashboard) │     │  (API/Utils)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  FastAPI    │
                    │   Backend   │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │  Redis  │    │PostgreSQL│   │  Disk   │
      │ (Queue) │    │ (Audit)  │   │(Frames) │
      └─────────┘    └─────────┘    └─────────┘
```

---

## 📂 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, module breakdown, data flow |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Setup, development workflow, deployment |
| [Guides/nasa_gibs_user_guide.md](./Guides/nasa_gibs_user_guide.md) | Satellite data source configuration |
| [Guides/production_readiness_report.md](./Guides/production_readiness_report.md) | Security, hardening, production checklist |

---

## 🛠️ Quick Start

### Prerequisites

- **Python 3.11+** (managed via `uv`)
- **Node.js 20+** (managed via `npm`)
- **Docker & Docker Compose**
- **NVIDIA GPU** (optional, recommended for RIFE/FILM performance)

### Option 1: Docker (Production Mode)

```bash
# Full stack with Caddy reverse proxy
docker compose up -d

# Access points:
# - Frontend: http://localhost
# - API: http://localhost/api/v1
# - API Docs: http://localhost/api/docs
```

### Option 2: Local Development

```bash
# 1. Smart setup (auto-detects GPU and configures dependencies)
python scripts/smart_setup.py

# 2. Start infrastructure services
docker compose up -d redis postgres

# 3. Start backend (terminal 1)
uv run uvicorn backend.app.main:app --reload --port 8000

# 4. Start Celery worker (terminal 2)
uv run celery -A backend.app.tasks.celery_app.celery_app worker --loglevel=info -P solo

# 5. Start frontend (terminal 3)
cd frontend && npm run dev
```

### Option 3: PowerShell One-Liner (Windows)

```powershell
# Starts Redis, backend, worker, and frontend in separate windows
./scripts/run_dev.ps1
```

---

## �️ Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route handlers
│   │   ├── services/            # Business logic (27 modules)
│   │   ├── tasks/               # Celery task definitions
│   │   ├── models/              # Pydantic schemas & SQLAlchemy
│   │   ├── middleware/          # Security, rate limiting
│   │   ├── main.py              # FastAPI entry point
│   │   └── config.py            # Pydantic-settings configuration
│   ├── data/                    # Runs, exports, cache, offline data
│   └── tests/                   # Pytest test suite
├── frontend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── brand/           # Landing pages, marketing, legal
│   │   │   ├── app/             # Dashboard, MapViewer, Analysis
│   │   │   └── shared/          # API client, types, utilities
│   │   ├── App.tsx              # Root router component
│   │   └── index.css            # Global theme variables
│   └── package.json             # Vite + React 19 + TypeScript
├── scripts/                     # Setup helpers
├── docker-compose.yml           # Full stack orchestration
├── Dockerfile                   # Backend container
├── Dockerfile.worker            # Celery worker container
└── pyproject.toml               # Python dependencies (uv)
```

---

## 🔑 Key Components

### Frontend Architecture

| Module | Path | Responsibility |
|--------|------|----------------|
| Brand | `src/modules/brand/` | Marketing pages, Earth scroll animation, legal docs |
| App | `src/modules/app/` | Dashboard, LayerControls, MapViewer (OpenLayers), AnalysisPanel |
| Shared | `src/modules/shared/` | API client, Zod schemas, design tokens |

### Backend Services (27 Modules)

| Service | Purpose |
|---------|---------|
| `interpolation.py` | RIFE/FILM engines, frame generation |
| `pipeline.py` | Orchestrates full interpolation workflow |
| `job_manager.py` | Async job queue, status tracking, audit events |
| `session_lock.py` | Redis-based exclusive access control |
| `report_service.py` | NASA-level HTML report generation |
| `satellite_providers.py` | NASA GIBS, LocalDisk, WMS clients |
| `video_gen.py` | MP4 export with FFmpeg |
| `confidence.py` | Per-frame quality scoring |
| `change_anomaly.py` | Change detection and anomaly analysis |
| `trajectory_tracker.py` | Motion vector tracking |
| `heatmap_gen.py` | Uncertainty visualization |
| `tile_cache.py` | WMS tile caching layer |

---

## 📊 Report Generation

AetherGIS generates professional NASA-level technical reports including:

- **Executive Summary** — Run status, key metrics, classification
- **Run Overview** — Timeline, performance, resource usage
- **Input Summary** — Satellite source, temporal coverage, AOI
- **Interpolation Configuration** — Model parameters, gap handling
- **Quality Metrics** — PSNR, SSIM, TCS, FSI with visual badges
- **Artifact Inventory** — Frame breakdown, confidence distribution
- **Anomaly Detection** — Issues flagged with severity classification
- **Traceability** — Full audit trail with timestamps

Reports are accessible at: `GET /api/v1/pipeline/{job_id}/report`

---

## 🔒 Security & Production

- **Environment-aware middleware**: HSTS, CSP, rate limiting in production
- **Session locking**: Prevents GPU contention
- **Heartbeat mechanism**: Auto-release after 60s inactivity
- **CORS configured**: Development vs production origins
- **Input validation**: Pydantic schemas throughout API

See [Production Readiness Report](./Guides/production_readiness_report.md) for full details.

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
uv run pytest backend/tests -v

# Run security tests (session lock, authentication)
uv run pytest backend/tests/test_session_lock.py backend/tests/test_auth.py -v

# Run API tests
uv run pytest backend/tests/test_api_*.py -v

# Run with coverage
uv run pytest backend/tests --cov=backend/app --cov-report=html
```

| Test Suite | Purpose | File |
|------------|---------|------|
| Security | Session lock, OAuth flow | `test_session_lock.py`, `test_auth.py` |
| Core Logic | Confidence scoring, preprocessing | `test_confidence.py`, `test_preprocessing.py` |
| API | Pipeline, Sessions endpoints | `test_api_pipeline.py`, `test_api_sessions.py` |
| Integration | Full module workflows | `test_production_modules.py` |
| Health | Monitoring endpoint | `test_health.py` |

### Frontend Build Verification

```bash
cd frontend

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Production build
npm run build
```

---

## 🔍 Backend Audit Summary

Recent comprehensive backend audit completed:

### Security Improvements
- Fixed auth bypass in `/me` endpoint (development mode)
- Added connection pooling for health checks
- Enhanced session lock heartbeat mechanism
- Improved rate limiting on all API endpoints

### Test Coverage
- **68 new tests** added across 5 new test files
- Security-focused tests for session locking and authentication
- API validation tests for all endpoints
- Performance tests for health endpoint

### Performance Optimizations
- Redis connection reuse in health checks
- Proper database session cleanup
- Cached GPU detection with exception handling

See [ARCHITECTURE.md](./ARCHITECTURE.md#14-recent-improvements-backend-audit) for full details.

---

## 📝 License

MIT License — See [LICENSE](./LICENSE) for details.

---

**© 2026 AetherGIS Team**

*Developed for Major Project Evaluation. Not for operational forecasting or scientific measurement. AI-interpolated frames are visual approximations only.*
