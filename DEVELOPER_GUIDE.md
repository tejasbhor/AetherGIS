# AetherGIS Developer Guide

Complete setup and development guide for AetherGIS v2.0. This document covers local development, environment configuration, deployment, and troubleshooting.

---

## 1. Prerequisites

### Required

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Python | 3.11+ | Backend runtime | [python.org](https://python.org) |
| Node.js | 20+ | Frontend runtime | [nodejs.org](https://nodejs.org) |
| Docker | Latest | Infrastructure services | [docker.com](https://docker.com) |
| uv | Latest | Python dependency management | `pip install uv` |

### Optional (Recommended)

| Tool | Purpose |
|------|---------|
| NVIDIA GPU + CUDA 12.1 | RIFE/FILM performance |
| Git | Version control |
| PowerShell 7 | Windows development |

---

## 2. Quick Start (Recommended)

### Step 1: Clone and Setup

```bash
git clone https://github.com/tejasbhor/AetherGIS.git
cd Major Project
```

### Step 2: Smart Hardware Detection

```bash
# Auto-detects GPU and configures torch dependencies
python scripts/smart_setup.py
```

This script:
- Checks for NVIDIA GPU via `nvidia-smi`
- Updates `pyproject.toml` with CUDA or CPU torch sources
- Runs `uv sync` to install dependencies

### Step 3: Start Infrastructure

```bash
# Start Redis and PostgreSQL
docker compose up -d redis postgres
```

### Step 4: Start Application (Three Options)

**Option A: PowerShell One-Liner (Windows)**
```powershell
./scripts/run_dev.ps1
```

**Option B: Manual Terminal Setup**
```bash
# Terminal 1: Backend API
uv run uvicorn backend.app.main:app --reload --port 8000

# Terminal 2: Celery Worker
uv run celery -A backend.app.tasks.celery_app.celery_app worker --loglevel=info -P solo

# Terminal 3: Frontend
cd frontend && npm run dev
```

**Option C: Docker Full Stack**
```bash
docker compose up -d
```

### Step 5: Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Landing Page | http://localhost:5173 | Brand/marketing site |
| Dashboard | http://localhost:5173/dashboard | GeoAI application |
| API Docs | http://localhost:8000/api/docs | Swagger UI |
| API Base | http://localhost:8000/api/v1 | REST endpoints |

---

## 3. Environment Configuration

### 3.1 Create .env File

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

### 3.2 Core Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AETHER_MODE` | No | `development` | `development` or `production` |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection |
| `DATABASE_URL` | No | `postgresql+psycopg://...` | PostgreSQL connection |
| `CELERY_BROKER_URL` | No | Same as REDIS_URL | Celery broker |
| `CELERY_RESULT_BACKEND` | No | `redis://localhost:6379/1` | Celery results |
| `GOOGLE_CLIENT_ID` | Production | - | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Production | - | OAuth secret |

### 3.3 Mode-Specific Behavior

| Feature | Development | Production |
|---------|-------------|------------|
| Session Queue | Disabled | Enabled |
| Rate Limiting | Disabled | Enabled |
| HSTS/CSP | Disabled | Enabled |
| Google Auth | Optional | Required |
| CORS Origins | `localhost:5173` | Configured |

---

## 4. Project Structure Deep Dive

### 4.1 Backend Organization

```
backend/
├── app/
│   ├── api/routes/          # FastAPI route handlers
│   │   ├── pipeline.py      # Core interpolation
│   │   ├── jobs.py          # Async job queue
│   │   ├── sessions.py      # Session locking
│   │   ├── analytics.py     # System metrics
│   │   └── advanced.py      # Reports, exports
│   ├── services/            # Business logic (27 modules)
│   │   ├── interpolation.py # RIFE/FILM engines
│   │   ├── pipeline.py      # Workflow orchestration
│   │   ├── job_manager.py   # Job lifecycle
│   │   ├── report_service.py # HTML reports
│   │   └── session_lock.py  # Redis locking
│   ├── tasks/               # Celery task definitions
│   ├── models/              # Pydantic schemas
│   └── middleware/          # Security, rate limiting
├── data/                    # Runtime data
│   ├── runs/                # Pipeline outputs
│   ├── exports/             # User downloads
│   ├── cache/               # WMS tile cache
│   └── offline/             # Demo data
└── tests/                   # Pytest suite
```

### 4.2 Frontend Organization

```
frontend/src/
├── modules/
│   ├── brand/               # Marketing pages
│   │   ├── components/      # EarthScrollScene, Navbar
│   │   └── *.tsx            # About, Product, Contact
│   ├── app/                 # Dashboard
│   │   ├── components/      # MapViewer, LayerControls
│   │   ├── store/           # Zustand state
│   │   └── theme/           # CSS variables
│   └── shared/              # API client, types
├── App.tsx                  # Root router
└── index.css                # Global styles
```

---

## 5. Development Workflow

### 5.1 Adding a New Backend Service

1. Create file in `backend/app/services/my_service.py`
2. Implement business logic
3. Add route in `backend/app/api/routes/` (existing or new)
4. Import and register in `backend/app/main.py`
5. Add tests in `backend/tests/`

### 5.2 Adding a New Frontend Component

1. Create component in appropriate module:
   - Dashboard: `frontend/src/modules/app/components/`
   - Brand: `frontend/src/modules/brand/components/`
2. Use path aliases for imports: `@app`, `@brand`, `@shared`
3. Add to parent component or router
4. Run `npm run build` to verify

### 5.3 Path Aliases Reference

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `@app` | `src/modules/app` | Dashboard components |
| `@brand` | `src/modules/brand` | Landing pages |
| `@shared` | `src/modules/shared` | API, types, utils |

---

## 6. Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/smart_setup.py` | Hardware detection, dependency sync | `python scripts/smart_setup.py` |
| `scripts/run_dev.ps1` | One-command dev startup (Windows) | `./scripts/run_dev.ps1` |
| `scripts/download_weights.py` | Download RIFE model weights | `python scripts/download_weights.py` |
| `scripts/download_film_weights.py` | Download FILM model weights | `python scripts/download_film_weights.py` |
| `scripts/setup_models.py` | Verify AI models are present | `python scripts/setup_models.py` |

---

## 7. Testing

### 7.1 Backend Tests

```bash
# Run all tests
uv run pytest backend/tests -v

# Run specific test suites
uv run pytest backend/tests/test_confidence.py -v           # Confidence scoring
uv run pytest backend/tests/test_preprocessing.py -v        # Preprocessing pipeline
uv run pytest backend/tests/test_session_lock.py -v         # Session locking (security)
uv run pytest backend/tests/test_auth.py -v                 # Authentication flow
uv run pytest backend/tests/test_api_pipeline.py -v         # Pipeline API
uv run pytest backend/tests/test_api_sessions.py -v         # Sessions API
uv run pytest backend/tests/test_health.py -v               # Health endpoint

# Run security-focused tests
uv run pytest backend/tests/test_session_lock.py backend/tests/test_auth.py -v

# Run with coverage
uv run pytest backend/tests --cov=backend/app --cov-report=html

# Run with specific markers
uv run pytest backend/tests -m "not slow" -v
```

#### Test Organization

| Test File | Purpose | Critical Path |
|-----------|---------|---------------|
| `test_confidence.py` | Frame quality scoring | Yes |
| `test_preprocessing.py` | Gap detection, deduplication | Yes |
| `test_production_modules.py` | Integration tests | Yes |
| `test_session_lock.py` | Security - GPU locking | **Security** |
| `test_auth.py` | Security - OAuth flow | **Security** |
| `test_api_pipeline.py` | API validation | Yes |
| `test_api_sessions.py` | Session management | Yes |
| `test_health.py` | Health monitoring | Yes |
| `test_wms_client.py` | WMS tile fetching | No |
| `test_film_engine.py` | AI model loading | No |

### 7.2 Frontend Build Verification

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

## 8. Deployment

### 8.1 Docker Production Deployment

```bash
# Full stack with Caddy reverse proxy
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f worker
```

### 8.2 Services Overview

| Service | Container | Purpose |
|---------|-----------|---------|
| caddy | `aethergis-proxy` | Reverse proxy, SSL termination |
| frontend | `aethergis-frontend` | Static SPA (Nginx) |
| backend | `aethergis-backend` | FastAPI API |
| worker | `aethergis-worker` | Celery GPU worker |
| postgres | `aethergis-postgres` | PostgreSQL database |
| redis | `aethergis-redis` | Redis queue/cache |

### 8.3 Production URLs

| Endpoint | Description |
|----------|-------------|
| `http://localhost` | Main application (Caddy) |
| `http://localhost/api/docs` | Swagger API documentation |
| `http://localhost/api/v1/health` | Health check |

### 8.4 Volume Persistence

Data persists across container restarts via Docker volumes:

- `aethergis_db_data` - PostgreSQL data
- `aethergis_redis_data` - Redis persistence
- `aethergis_runs` - Pipeline output frames
- `aethergis_exports` - User export downloads
- `aethergis_cache` - WMS tile cache

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ModuleNotFoundError` | Dependencies not synced | Run `uv sync` |
| `Connection refused` to Redis | Redis not running | `docker compose up -d redis` |
| GPU not detected | CUDA not installed | Check `nvidia-smi`, install CUDA 12.1 |
| Worker not processing jobs | Worker not running | Start Celery worker |
| CORS errors | Origins mismatch | Check `CORS_ORIGINS` in `.env` |
| Build fails | Type errors | Run `npx tsc --noEmit` |

### 9.2 Reset Everything

```bash
# Stop all services
docker compose down

# Remove Docker volumes (WARNING: deletes all data)
docker compose down -v

# Reset Python environment
rm -rf .venv uv.lock
uv sync

# Reset frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 9.3 Debug Mode

```bash
# Backend with debug logging
LOG_LEVEL=DEBUG uv run uvicorn backend.app.main:app --reload

# Celery with debug logging
uv run celery -A backend.app.tasks.celery_app worker --loglevel=debug -P solo
```

---

## 10. Configuration Reference

### 10.1 Full Environment Variables

See `backend/app/config.py` for all available settings:

```python
# Core settings
api_host: str = '127.0.0.1'
api_port: int = 8000
log_level: str = 'INFO'
aether_mode: str = 'development'

# Infrastructure
redis_url: str = 'redis://localhost:6379/0'
celery_broker_url: str = 'redis://localhost:6379/0'
database_url: str | None = None

# AI Models
cuda_device: str = 'mps'  # or 'cuda'
rife_model_path: Path = ...
film_model_path: Path = ...

# Security
google_client_id: str = ''
google_client_secret: str = ''
rate_limit_requests_per_minute: int = 600

# Limits
max_frames_per_session: int = 48
max_active_runs: int = 1
max_queued_runs: int = 1
```

---

## 11. Contributing Guidelines

### 11.1 Code Style

- **Python**: PEP 8, type hints required
- **TypeScript**: Strict mode enabled
- **Imports**: Use path aliases, no relative imports across modules

### 11.2 Commit Messages

```
feat: add new interpolation model
fix: resolve session lock race condition
docs: update API endpoint documentation
refactor: simplify pipeline orchestration
test: add unit tests for confidence scoring
```

### 11.3 Pull Request Process

1. Create feature branch from `main`
2. Add tests for new functionality
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

---

## 12. Resources

### 12.1 Internal Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [README.md](./README.md) - Project overview
- [Guides/nasa_gibs_user_guide.md](./Guides/nasa_gibs_user_guide.md) - Data sources
- [Guides/production_readiness_report.md](./Guides/production_readiness_report.md) - Security

### 12.2 External References

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Celery Docs](https://docs.celeryq.dev)
- [OpenLayers Docs](https://openlayers.org/doc)
- [NASA GIBS](https://nasa-gibs.github.io)

---

*Last updated: 2026-04-28*
