# AetherGIS Developer Guide

This guide covers everything you need to set up, develop, and deploy AetherGIS v2.0.

## 1. Prerequisites

- **Python 3.12+** (Managed via `uv` recommended)
- **Node.js 20+** (Managed via `npm` or `fnm`)
- **Docker & Docker Compose** (For Redis/Database)
- **NVIDIA GPU** (Optional, but recommended for RIFE/FILM performance)

---

## 2. Local Setup (Development)

### 2.1 Backend Setup
We use `uv` for lightning-fast dependency management.

```bash
# Install uv if you haven't
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Sync dependencies
uv sync

# Start the services (Redis is required)
docker compose up -d redis

# Start the API
uv run uvicorn backend.app.main:app --reload --port 8000

# Start a Celery Worker (In a separate terminal)
uv run celery -A backend.app.tasks.celery_app worker --loglevel=info -P solo
```

### 2.2 Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 3. Environment Configuration

Create a `.env` file in the root directory.

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | `development` or `production` | `development` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `MAX_CONCURRENT_USERS` | Session lock limit | `1` |
| `HEARTBEAT_TIMEOUT_SECONDS` | Auto-release timer | `60` |

---

## 4. Building for Production

To validate the codebase and generate production artifacts:

```bash
cd frontend
npm run build
```

The output will be in `frontend/dist/`. This is a static SPA that can be served via Nginx or Vercel.

---

## 5. Deployment (Docker)

To deploy the entire stack as a containerized product:

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

### 5.1 Monitoring
Access the **Flower** dashboard at `http://localhost:5555` to monitor AI task queues and worker health.

---

## 6. Project Conventions

- **Frontend**: Use `@shared`, `@app`, and `@brand` aliases. Avoid relative imports across module boundaries.
- **Backend**: Every new feature should be implemented as a module in `backend/app/services/` and registered in `main.py`.
- **Styling**: Vanilla CSS for the App module; advanced CSS-in-JS or Tailwind for the Brand module (if requested).
