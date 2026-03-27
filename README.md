# AetherGIS — AI-Based Temporal Enhancement & WebGIS Visualization System

> **⚠️ SCIENTIFIC DISCLAIMER:** All AI-interpolated frames are visual approximations. NOT suitable for scientific measurement, operational forecasting, or any safety-critical decisions. Always use observed satellite data for analysis.

## Overview

AetherGIS bridges temporal gaps in satellite imagery by:
- **Ingesting** real satellite data from NASA GIBS via WMS
- **Interpolating** frames using RIFE 4.x AI model (RTX GPU accelerated)
- **Enforcing** multi-layer accuracy control (optical flow + confidence scoring)
- **Delivering** a premium WebGIS interface built on OpenLayers 9

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI 0.111 + Uvicorn |
| AI Engine | **FILM (Primary)** + RIFE 4.x (PyTorch + CUDA 12.8) |
| Job Queue | Celery + Redis (Docker) |
| Image Processing | OpenCV + NumPy + scikit-image |
| Video | FFmpeg |
| Frontend | React 18 + TypeScript + Vite |
| Map | OpenLayers 9.x |
| State | Zustand |
| Data Fetching | React Query + Axios |

## Quick Start

### Prerequisites
- Python 3.11+ with `uv` ([install](https://docs.astral.sh/uv/))
- Node.js 20+
- Docker Desktop (for Redis)
- NVIDIA GPU + CUDA Toolkit (RTX 4060 recommended)
- FFmpeg ([install](https://ffmpeg.org/download.html))

### 1. Clone & Setup

```powershell
cd "D:\Major Project"
cp .env.example .env
```

### 2. Install Python Dependencies

```powershell
uv sync
```

### 3. Download RIFE Model Weights (~130 MB)

```powershell
uv run python scripts/download_weights.py
```

### 4. Start Redis (Docker)

```powershell
docker compose up redis -d
```

### 5. Start Backend

```powershell
# Terminal 1: FastAPI server
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Celery worker
uv run celery -A backend.app.tasks.celery_app.celery_app worker --loglevel=info
```

### 6. Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

## Running Tests

```powershell
# Backend tests (all 3 test files)
uv run pytest backend/tests/ -v

# Frontend type-check
cd frontend && npx tsc --noEmit
```

## Architecture

```
D:/Major Project/
├── pyproject.toml              # uv project (Python deps)
├── docker-compose.yml          # Redis + Celery worker
├── .env.example                # Environment variable template
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── api/routes/         # REST API endpoints
│   │   ├── services/           # Core business logic
│   │   │   ├── wms_client.py   # NASA GIBS WMS client
│   │   │   ├── preprocessing.py # Alignment, normalization, gap analysis
│   │   │   ├── interpolation.py # RIFE + LK fallback engines
│   │   │   ├── confidence.py   # Optical flow + CS algorithm
│   │   │   ├── video_gen.py    # FFmpeg video generation
│   │   │   └── pipeline.py     # Full orchestrator
│   │   ├── models/schemas.py   # Pydantic models
│   │   └── tasks/celery_app.py # Celery task
│   └── tests/                  # pytest test suite
├── frontend/                   # Vite + React + TypeScript
│   └── src/
│       ├── components/         # 7 UI components
│       ├── store/useStore.ts   # Zustand state
│       └── api/client.ts       # Axios + React Query
└── scripts/
    └── download_weights.py     # RIFE weight downloader
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | System health (Redis, GPU, RIFE) |
| `GET` | `/api/v1/layers` | List NASA GIBS layers |
| `GET` | `/api/v1/layers/{id}/capabilities` | Layer time range & resolution |
| `POST` | `/api/v1/pipeline/run` | Submit pipeline job |
| `GET` | `/api/v1/pipeline/{job_id}/status` | Poll job status |
| `GET` | `/api/v1/pipeline/{job_id}/results` | Full pipeline results |
| `GET` | `/api/v1/pipeline/{job_id}/video/{type}` | Stream MP4 video |
| `GET` | `/api/v1/pipeline/{job_id}/frames/{idx}` | Individual frame PNG |

**Interactive API docs:** http://localhost:8000/api/docs

## Accuracy Control System

Per PRD §6.4 & §11:

| Mechanism | Description |
|-----------|-------------|
| **Optical Flow Validation** | Forward-backward Farneback consistency check |
| **Temporal Segmentation** | Large gaps split into sub-intervals |
| **MAD Thresholding** | Large pixel change → reduced interpolation |
| **Confidence Scoring** | CS = 0.40×(1-flow) + 0.35×(1-MAD) + 0.25×(1-gap_factor) |
| **Conservative Merge** | min(weighted, worst_sub_score) — Rule OI-01 |
| **Adaptive Thresholding** | Optimized mean (>0.001) for nighttime IR imagery |
| **Monsoon Presets** | New Indian Subcontinent preset (RSMC New Delhi) |
| **Watermarking** | Rule OI-02: Every AI frame carries burned-in metadata |

## Supported Layers (Phase 1)

| Layer | ID | Interval |
|-------|----|---------|
| GOES East Full Disk | `GOES-East_ABI_Band2_Red_Visible_1km` | 10 min |
| Himawari AHI Band 3 | `Himawari_AHI_Band3_Red_Visible_1km` | 10 min |
| MODIS Terra True Color | `MODIS_Terra_CorrectedReflectance_TrueColor` | Daily |
| MODIS Aqua True Color | `MODIS_Aqua_CorrectedReflectance_TrueColor` | Daily |
| VIIRS Day-Night Band | `VIIRS_SNPP_DayNightBand_ENCC` | Daily |
