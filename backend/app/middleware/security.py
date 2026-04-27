"""AetherGIS — Security + Rate Limiting Middleware (MODULE 12).

Features:
  • Optional API key validation (X-API-Key header or ?api_key= query param)
  • Per-IP rate limiting using Redis sliding window
  • Request validation (payload size, content-type checks)
  • Security headers injection
"""
from __future__ import annotations

import time
from typing import Callable, Optional

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Rate limit config (Defaulting to 600 for frame-heavy playback)
RATE_LIMIT_REQUESTS = getattr(settings, "rate_limit_requests_per_minute", 600)
RATE_LIMIT_WINDOW_SECONDS = 60     # 1-minute window
RATE_LIMIT_BURST = 50              # allowed burst above limit
MAX_BODY_SIZE_MB = 50              # max request body size

# Paths that bypass rate limiting
RATE_LIMIT_EXEMPT_EXACT = {
    "/api/v1/health",
    "/api/v1/",
    "/",
    "/api/docs",
    "/api/redoc",
    "/api/openapi.json",
}

RATE_LIMIT_EXEMPT_CONTAINS = {
    "/frames/",
    "/video/",
}

# Paths that require API key (if API keys are configured)
API_KEY_REQUIRED_PREFIXES = [
    "/api/v1/jobs",
    "/api/v1/pipeline",
    "/api/v1/region",
    "/api/v1/metrics",
    "/api/v1/system",
]

API_KEY_EXEMPT_EXACT = {
    "/api/v1/system/config",
    "/api/v1/system/providers",
    "/api/v1/system/session/status",
    "/api/v1/system/session/heartbeat",
    "/api/v1/system/session/release",
}


def _get_redis():
    try:
        import redis as redis_sync
        r = redis_sync.from_url(settings.redis_url, socket_connect_timeout=1, decode_responses=True)
        r.ping()
        return r
    except Exception:
        return None


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, accounting for proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit_redis(ip: str, r) -> tuple[bool, int, int]:
    """Sliding window rate limit using Redis.

    Returns: (is_allowed, current_count, retry_after_seconds)
    """
    key = f"aethergis:ratelimit:{ip}"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, RATE_LIMIT_WINDOW_SECONDS + 5)
    results = pipe.execute()

    count = results[2]
    allowed = count <= RATE_LIMIT_REQUESTS + RATE_LIMIT_BURST
    retry_after = RATE_LIMIT_WINDOW_SECONDS if not allowed else 0
    return allowed, count, retry_after


# In-memory fallback rate limiter
_mem_rate: dict[str, list[float]] = {}


def _check_rate_limit_memory(ip: str) -> tuple[bool, int, int]:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    history = _mem_rate.get(ip, [])
    history = [t for t in history if t > window_start]
    history.append(now)
    _mem_rate[ip] = history[-500:]  # cap list size
    count = len(history)
    allowed = count <= RATE_LIMIT_REQUESTS + RATE_LIMIT_BURST
    retry_after = RATE_LIMIT_WINDOW_SECONDS if not allowed else 0
    return allowed, count, retry_after


def _check_api_key(request: Request) -> bool:
    """Validate API key if one is configured in settings."""
    # If no API key is configured, all requests are allowed
    configured_keys = getattr(settings, "api_keys", [])
    if not configured_keys:
        return True

    # Authenticated dashboard users can rely on their session cookie instead of an API key.
    if request.cookies.get(settings.session_cookie_name):
        return True

    provided = (
        request.headers.get("X-API-Key")
        or request.query_params.get("api_key")
    )
    return provided in configured_keys


class SecurityMiddleware(BaseHTTPMiddleware):
    """Combined security middleware: rate limiting + API key + security headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        ip = _get_client_ip(request)

        # ── Rate limiting ─────────────────────────────────────────────────────
        # Only enforce rate limiting in production mode
        if settings.aether_mode == 'production':
            is_exempt = (
                path in RATE_LIMIT_EXEMPT_EXACT or 
                any(sub in path for sub in RATE_LIMIT_EXEMPT_CONTAINS)
            )
            
            if not is_exempt:
                r = _get_redis()
                if r:
                    allowed, count, retry_after = _check_rate_limit_redis(ip, r)
                else:
                    allowed, count, retry_after = _check_rate_limit_memory(ip)

                if not allowed:
                    logger.warning("Rate limit exceeded", ip=ip, count=count, path=path)
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Too many requests. Please slow down.",
                            "retry_after_seconds": retry_after,
                        },
                        headers={
                            "Retry-After": str(retry_after),
                            "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
                            "X-RateLimit-Remaining": "0",
                        },
                    )

        # ── API key check ─────────────────────────────────────────────────────
        requires_key = any(path.startswith(prefix) for prefix in API_KEY_REQUIRED_PREFIXES) and path not in API_KEY_EXEMPT_EXACT
        if requires_key and not _check_api_key(request):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid API key. Pass X-API-Key header."},
            )

        # ── Request size validation ───────────────────────────────────────────
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE_MB * 1_048_576:
            return JSONResponse(
                status_code=413,
                content={"detail": f"Request body too large. Max {MAX_BODY_SIZE_MB}MB."},
            )

        # ── Process request ───────────────────────────────────────────────────
        response = await call_next(request)

        # ── Inject security headers ───────────────────────────────────────────
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)

        if settings.aether_mode == 'production':
            # 1 year HSTS
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            # Basic CSP - allow own domain and NASA/MOSDAC domains
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https://*.nasa.gov https://*.gov.in https://*.jaxa.jp; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
            )

        return response
