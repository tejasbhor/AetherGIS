"""AetherGIS - FastAPI application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager

import redis as redis_sync
import torch
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import get_settings
from backend.app.models.schemas import HealthResponse
from backend.app.services.interpolation import FILMEngine, RIFEEngine, get_engine
from backend.app.utils.logging import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('AetherGIS API starting up', version='1.0.0')
    settings.ensure_dirs()
    yield
    logger.info('AetherGIS API shut down')


app = FastAPI(
    title='AetherGIS API',
    description=(
        'AI-Based Temporal Enhancement & WebGIS Visualization System.\n\n'
        'All interpolated frames are visual approximations and are NOT suitable for scientific measurement or quantitative analysis.'
    ),
    version='1.0.0',
    lifespan=lifespan,
    docs_url='/api/docs',
    redoc_url='/api/redoc',
    openapi_url='/api/openapi.json',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def add_request_id(request: Request, call_next) -> Response:
    import uuid
    import structlog

    request_id = str(uuid.uuid4())[:8]
    structlog.contextvars.bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers['X-Request-ID'] = request_id
    structlog.contextvars.clear_contextvars()
    return response


from backend.app.api.routes import layers, pipeline  # noqa: E402

app.include_router(pipeline.router, prefix='/api/v1')
app.include_router(layers.router, prefix='/api/v1')


@app.get('/api/v1/health', response_model=HealthResponse, tags=['System'])
async def health_check() -> HealthResponse:
    redis_ok = False
    try:
        redis_client = redis_sync.from_url(settings.redis_url, socket_connect_timeout=2)
        redis_client.ping()
        redis_ok = True
    except Exception:
        pass

    gpu_ok = torch.cuda.is_available()
    gpu_device_name = torch.cuda.get_device_name(0) if gpu_ok else None

    # Get engines (cached in _engines dict)
    rife_laoded = get_engine('rife').is_loaded
    film_loaded = get_engine('film').is_loaded

    return HealthResponse(
        status='healthy' if redis_ok else 'degraded',
        redis_connected=redis_ok,
        gpu_available=gpu_ok,
        gpu_device_name=gpu_device_name,
        rife_model_loaded=rife_laoded,
        film_model_loaded=film_loaded,
    )


@app.get('/', tags=['System'])
async def root() -> dict:
    return {
        'service': 'AetherGIS API',
        'version': '1.0.0',
        'docs': '/api/docs',
        'disclaimer': 'All interpolated frames are visual approximations and are NOT suitable for scientific measurement or quantitative analysis.',
    }
