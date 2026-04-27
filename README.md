# AetherGIS v2.0 — Production-Grade GeoAI Platform

AI-Based Temporal Enhancement & WebGIS Visualization System for Satellite Imagery.

[![Architecture](https://img.shields.io/badge/Architecture-Modular_Monolith-blue)](./ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](./DEVELOPER_GUIDE.md)

---

## 🚀 Overview

AetherGIS v2.0 is a comprehensive platform for high-resolution temporal interpolation of satellite imagery. It leverages advanced AI (RIFE/FILM) to generate smooth intermediate frames between sparse satellite captures, enabling fluid visualization of meteorological events.

### Key Production Features:
- **Modular Monolith Architecture**: Clean segregation of SaaS Brand assets from the core GeoAI App.
- **Exclusive Session Queue**: Hardware-aware locking ensures GPU stability for concurrent users.
- **Hybrid Data Ingestion**: Seamless fallback between NASA GIBS, ISRO Bhuvan (Planned), and Offline Data.
- **15-Module Backend**: Integrated analytics including Uncertainty Heatmaps, Anomaly Detection, and Change Analysis.

---

## 📂 Documentation Portal

| Guide | Description |
|-------|-------------|
| 📘 [**Architecture.md**](./ARCHITECTURE.md) | Deep dive into the modular structure, queuing logic, and data flow. |
| 🛠️ [**Developer_Guide.md**](./DEVELOPER_GUIDE.md) | Setup instructions for local development and cloud deployment. |
| 🛰️ [**NASA GIBS User Guide**](./Guides/nasa_gibs_user_guide.md) | Detailed manual for navigating and configuring satellite layers. |
| 📈 [**Production Readiness**](./Guides/production_readiness_report.md) | Audit results and security hardening specifications. |

---

## 🛠️ Quick Start

### 1. The Easy Way (Docker)
Ensure you have Docker installed, then run:
```bash
docker compose up -d
```

### 2. The Dev Way (Local)
```bash
# Backend
uv sync
uv run uvicorn backend.app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to view the SaaS Landing Page.

---

## 🎨 System Highlights

### Modular Frontend Segregation
We use path aliasing to maintain strict boundaries between our SaaS marketing layer and the AI analysis engine:
- `@brand`: Landing Page, Documentation, Legal.
- `@app`: Map Viewer, Analysis Panel, Export Engine.
- `@shared`: API Client, Design Tokens, Utilities.

### Hardware-Exclusive Queuing
To protect GPU resources, AetherGIS implements a **Redis-backed Session Lock**. Users entering the dashboard are queued if the hardware is currently busy with another analysis run.

---

## 🤝 Contributing

We welcome academic and professional contributions! Please refer to our [Developer Guide](./DEVELOPER_GUIDE.md) for coding standards and module registration patterns.

---

© 2026 AetherGIS Team. Developed for Major Project Evaluation.
