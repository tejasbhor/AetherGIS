# AetherGIS: NASA GIBS Pipeline Guide

**Platform Version:** v2.0.0 Production  
**Primary Data Source:** NASA GIBS (Global Imagery Browse Services)  
**Interpolation Models:** RIFE 4.x, Google FILM, LK Fallback

---

## 1. Data Source Architecture

### 1.1 Available Providers

| Provider | Status | Use Case |
|----------|--------|----------|
| NASA GIBS | **Active** | Primary cloud WMS source for global MODIS/VIIRS data |
| LocalDisk | **Active** | Offline demo mode using `backend/data/offline/` |
| ISRO Bhuvan | Planned | Indian subcontinent high-resolution (WMS integration) |

### 1.2 Provider Switching

When changing data sources during active processing:

1. System displays confirmation dialog
2. Current pipeline must be forfeited
3. Prevents orphaned background processes
4. Clears session cache for new source

**Implementation:** `LayerControls.tsx` handles provider state management.

---

## 2. Layer Selection & Domain Configuration

### 2.1 Layer Capabilities Flow

```
User selects NASA GIBS
        │
        ▼
Frontend requests /api/v1/layers/capabilities
        │
        ▼
Backend queries WMS GetCapabilities
        │
        ▼
Returns available layers + domains
        │
        ▼
UI populates Layer selector + DOM dropdown
```

### 2.2 Domain (DOM) Entries

Domain presets are **dynamically fetched** from `layer_capabilities.py`:

1. Select satellite layer (e.g., MODIS Terra True Color)
2. System fetches capabilities from NASA GIBS WMS
3. **Monitoring Domain** dropdown populates with valid regions
4. AOI selection constrained to layer boundaries

**Key Files:**
- `backend/app/services/layer_capabilities.py` - Catalog management
- `backend/app/services/satellite_providers.py` - NASA_GIBS_Provider
- `frontend/src/modules/app/components/LayerControls.tsx` - UI controls

### 2.3 Supported Layer Types

| Layer | ID Pattern | Resolution | Best For |
|-------|------------|------------|----------|
| MODIS Terra True Color | `MODIS_Terra_CorrectedReflectance_TrueColor` | 250m-1km | General visualization |
| MODIS Aqua True Color | `MODIS_Aqua_CorrectedReflectance_TrueColor` | 250m-1km | General visualization |
| VIIRS SNPP True Color | `VIIRS_SNPP_CorrectedReflectance_TrueColor` | 375m | Night/cloud detection |
| MODIS Clouds | `MODIS_Terra_Cloud_Top_Height_Day` | 5km | Meteorological analysis |

---

## 3. AI Interpolation Model Selection

### 3.1 Model Registry

| Model | Engine | Hardware | Best For |
|-------|--------|----------|----------|
| **RIFE 4.x** | `RIFEEngine` | CUDA/MPS | General temporal interpolation |
| **FILM** | `FILMEngine` | CUDA/MPS | Large motion (storms, fast clouds) |
| **LK Fallback** | `LKEngine` | CPU | Low-resource environments |

### 3.2 Model Selection UI

Located in `LayerControls.tsx`:
- Dropdown selector in left sidebar
- Auto-detects GPU availability
- Disables CUDA models if no GPU detected
- Falls back to LK automatically if CUDA unavailable

### 3.3 Model Weights

Download scripts available:
```bash
python scripts/download_weights.py      # RIFE
python scripts/download_film_weights.py # FILM
python scripts/setup_models.py          # Verify all present
```

Weights stored in: `backend/app/ai_models/`

---

## 4. Temporal Configuration

### 4.1 Frame Generation Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| Frames Between Pairs | 1-8 | Interpolated frames per satellite gap |
| Time Step | 15-360 min | Base temporal resolution |
| Smart Sampling | Auto | Adjusts step based on gap stability |

### 4.2 Smart Temporal Sampling

System automatically adjusts intervals based on gap characteristics:

```
Gap < 15 min  →  Standard interpolation
Gap 15-30 min →  30 min step recommended
Gap 30-60 min →  60 min step recommended
Gap > 60 min  →  Warning: Large gaps reduce quality
```

**Implementation:** `backend/app/services/temporal_checker.py`

### 4.3 Gap Categories

| Category | Time Range | Confidence Impact |
|----------|------------|---------------------|
| Short | ≤ 15 min | High confidence |
| Medium | 15-30 min | Medium confidence |
| Large | 30-60 min | Low confidence |
| Extreme | > 60 min | Rejected |

---

## 5. Session Management & Job Control

### 5.1 Job Execution Flow

```
Click "Run Pipeline"
        │
        ▼
Create job record in PostgreSQL
        │
        ▼
Submit Celery task to Redis queue
        │
        ▼
Acquire session lock (if production)
        │
        ▼
Execute pipeline stages:
  1. Ingestion (WMS tile fetch)
  2. Preprocessing (normalize)
  3. Interpolation (RIFE/FILM)
  4. Export (video, frames, report)
        │
        ▼
Release lock, store results
```

### 5.2 UI Locking During Execution

- **Left sidebar** (`LayerControls`): Disabled during pipeline
- **Run button**: Shows progress, becomes "Processing..."
- **Status bar**: Real-time stage updates
- **Analysis panel**: Shows metrics as generated

**Implementation:** `useStore` Zustand state manages `isProcessing` flag.

### 5.3 Session History

Completed jobs stored in:
- **PostgreSQL**: Job metadata, audit trail
- **Disk**: `backend/data/runs/{job_id}/` - frames, video, report
- **Frontend cache**: Session list for quick access

Access via: `frontend/src/modules/app/components/SessionManager.tsx`

---

## 6. Advanced Analytics & Overlays

### 6.1 Available Overlays

| Overlay | Source | Description |
|---------|--------|-------------|
| **Confidence Heatmap** | `confidence.py` | Per-pixel interpolation certainty |
| **Change Map** | `change_anomaly.py` | Pixel-level change detection |
| **Trajectories** | `trajectory_tracker.py` | Motion vector visualization |
| **Uncertainty** | `uncertainty_maps.py` | Quality variance regions |

### 6.2 Controls Location

**Analysis Panel** (`frontend/src/modules/app/components/AnalysisPanel.tsx`):
- Toggle switches for each overlay
- Alpha/opacity sliders
- Real-time toggle (no restart required)

### 6.3 Metrics Display

Right sidebar shows:
- **Metric Evolution**: PSNR, SSIM, TCS over time
- **Time Series**: Brightness, motion, cloud coverage
- **Quality Summary**: Aggregate scores

---

## 7. Report Generation

### 7.1 NASA-Level Technical Reports

System generates comprehensive HTML reports:

**Sections:**
1. Executive Summary
2. Run Overview (timeline, duration)
3. Input Summary (source, AOI, coverage)
4. Configuration (model params)
5. Quality Metrics (PSNR, SSIM, TCS, FSI)
6. Artifact Inventory (frame breakdown)
7. Anomaly Detection
8. Technical Diagnostics
9. Limitations & Caveats
10. Full Audit Trail

### 7.2 Accessing Reports

```bash
# API endpoint
GET /api/v1/pipeline/{job_id}/report

# Or via Analysis Panel
Click "View Report" button in right sidebar
```

**Implementation:** `backend/app/services/report_service.py`

---

## 8. Troubleshooting NASA GIBS

### 8.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Layer not available" | WMS timeout | Check network, retry |
| "No data for AOI" | Outside coverage | Select different layer/domain |
| Slow tile loading | NASA GIBS load | Use LocalDisk for demos |
| Missing timestamps | Data gap | Select different date range |
| Black frames | Cloud cover | Check MODIS cloud mask |

### 8.2 Debugging WMS

```bash
# Test WMS connection
curl "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities"

# Check backend logs
uv run uvicorn backend.app.main:app --log-level debug
```

---

## 9. API Reference

### 9.1 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | System health (Redis, DB, GPU status) |
| `/api/v1/layers` | GET | List available layers |
| `/api/v1/layers/capabilities` | GET | WMS capabilities |
| `/api/v1/pipeline/run` | POST | Start interpolation |
| `/api/v1/pipeline/{id}/status` | GET | Job progress |
| `/api/v1/pipeline/{id}/report` | GET | HTML report |
| `/api/v1/jobs/{id}/frames/{n}` | GET | Individual frame |
| `/api/v1/jobs/{id}/video` | GET | MP4 export |

### 9.2 Full API Docs

Available at: `http://localhost:8000/api/docs` (Swagger UI)

---

*Last updated: 2026-04-28*
