"""Request identity helpers for per-user data isolation."""
from __future__ import annotations

import hashlib

from fastapi import HTTPException, Request

from backend.app.config import get_settings

settings = get_settings()


def resolve_current_user_id(request: Request) -> str:
    """Resolve a stable per-user ID from the auth session cookie.

    In production this enforces authenticated access for data-bearing routes.
    The cookie value is hashed before persistence usage.
    """
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        if settings.aether_mode == "production":
            raise HTTPException(status_code=401, detail="Authentication required")
        return "dev-anonymous"

    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return f"usr_{digest[:32]}"
