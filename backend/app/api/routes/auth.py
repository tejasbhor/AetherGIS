"""AetherGIS - Authentication Routes (Google OAuth)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse
import requests
from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()
logger = get_logger(__name__)

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
async def callback(code: str, response: Response):
    """Handle Google OAuth callback and issue session token."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google Auth not configured")

    if code == "mock_dev_code":
        # CRITICAL SECURITY GUARD: Never allow mock codes in production
        if settings.aether_mode == "production":
            logger.error("Security Alert: Mock code attempt in production mode")
            raise HTTPException(status_code=403, detail="Unauthorized authentication method")
        access_token = "mock_dev_token_123"
    else:
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
            key="aether_session",
            value=access_token,
            httponly=True,
            secure=True, # Should be True in real production
            samesite="lax",
            max_age=3600 * 24 # 24 hours
        )
        return response
    except Exception as exc:
        logger.error("OAuth exchange failed", error=str(exc))
        return RedirectResponse(url="/?error=auth_failed")

@router.get("/me")
async def get_me(request: Request):
    """Verify current session and return user info."""
    session = request.cookies.get("aether_session")
    if settings.aether_mode != "production":
        return {"authenticated": True, "user": "demo_user", "mode": "development"}
    
    if not session:
        return {"authenticated": False}
    
    # In production, we would verify the token with Google
    # For now, we'll return a mock success if the cookie exists
    return {
        "authenticated": True, 
        "user": "authorized_user",
        "mode": "production"
    }

@router.get("/logout")
async def logout(response: Response):
    """Clear session cookie."""
    response = RedirectResponse(url="/")
    response.delete_cookie("aether_session")
    return response
