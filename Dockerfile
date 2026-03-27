# TemporalGIS — FastAPI Backend Dockerfile
FROM python:3.11-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt-cache/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Use the local virtualenv
ENV PATH="/app/.venv/bin:$PATH"

# Install dependencies
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY backend ./backend
COPY .env ./

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uv", "run", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
