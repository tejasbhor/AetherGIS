"""AetherGIS - Authentication Routes (Google OAuth)."""
from __future__ import annotations

import hashlib
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import requests
from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()
logger = get_logger(__name__)


def _cookie_secure() -> bool:
    callback_scheme = urlparse(settings.google_callback_url).scheme
    return settings.session_cookie_secure or settings.aether_mode == "production" or callback_scheme == "https"


def _safe_return_path(return_to: str | None) -> str:
    if not return_to:
        return "/"
    if return_to.startswith("/") and not return_to.startswith("//"):
        return return_to
    return "/"

@router.get("/login")
async def login():
    """Initiate Google OAuth flow."""
    if settings.aether_mode != "production" and not settings.google_client_id:
        # Mock login for development preview
        return RedirectResponse(url="/api/v1/auth/callback?code=mock_dev_code")

    if not settings.google_client_id:
        logger.error("Google Client ID not configured")
        raise HTTPException(status_code=500, detail="Google Auth not configured")

    # Construct Google OAuth URL
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_callback_url}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return RedirectResponse(url=auth_url)

@router.get("/callback")
async def callback(code: str):
    """Handle Google OAuth callback and issue session token."""
    if code == "mock_dev_code":
        # CRITICAL SECURITY GUARD: Never allow mock codes in production
        if settings.aether_mode == "production":
            logger.error("Security Alert: Mock code attempt in production mode")
            raise HTTPException(status_code=403, detail="Unauthorized authentication method")
        access_token = "mock_dev_token_123"
    else:
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(status_code=500, detail="Google Auth not configured")
        # Exchange code for token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_callback_url,
            "grant_type": "authorization_code",
        }
        token_resp = requests.post(token_url, data=token_data)
        token_resp.raise_for_status()
        token_info = token_resp.json()
        access_token = token_info.get("access_token")
    
    try:
        # Redirect to dashboard with the token or set a cookie
        # We'll use a cookie for simplicity in the AuthGate
        response = RedirectResponse(url="/dashboard")
        response.set_cookie(
            key=settings.session_cookie_name,
            value=access_token,
            httponly=True,
            secure=_cookie_secure(),
            samesite=settings.session_cookie_samesite,
            path="/",
            max_age=3600 * 24 # 24 hours
        )
        return response
    except Exception as exc:
        logger.error("OAuth exchange failed", error=str(exc))
        return RedirectResponse(url="/?error=auth_failed")

@router.get("/me")
async def get_me(request: Request):
    """Verify current session and return user info."""
    session = request.cookies.get(settings.session_cookie_name)
    
    # Development mode with explicit mock token allows bypass
    if settings.aether_mode != "production" and session == "mock_dev_token_123":
        return {"authenticated": True, "user": "demo_user", "mode": "development"}
    
    # Production mode or development without mock token requires valid session
    if not session:
        return {"authenticated": False}

    user_fingerprint = hashlib.sha256(session.encode("utf-8")).hexdigest()[:12]
    
    # In production with real tokens, verify with Google
    # For now, we accept any non-empty session cookie as valid (improve with JWT/OAuth verification)
    return {
        "authenticated": True, 
        "user": f"user_{user_fingerprint}",
        "mode": settings.aether_mode
    }

@router.get("/logout")
async def logout(return_to: str | None = None):
    """Clear session cookie."""
    response = RedirectResponse(url=_safe_return_path(return_to))
    response.delete_cookie(
        settings.session_cookie_name,
        path="/",
        secure=_cookie_secure(),
        httponly=True,
        samesite=settings.session_cookie_samesite,
    )
    return response
