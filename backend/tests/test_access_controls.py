from contextlib import contextmanager

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.api.routes import analytics as analytics_routes
from backend.app.api.routes import auth as auth_routes


@contextmanager
def patch_settings(**overrides):
    original: dict[str, object] = {}
    try:
        for key, value in overrides.items():
            original[key] = getattr(analytics_routes.settings, key)
            setattr(analytics_routes.settings, key, value)
            if hasattr(auth_routes.settings, key):
                setattr(auth_routes.settings, key, value)
        yield
    finally:
        for key, value in original.items():
            setattr(analytics_routes.settings, key, value)
            if hasattr(auth_routes.settings, key):
                setattr(auth_routes.settings, key, value)


def test_system_config_keeps_localhost_out_of_preview_mode():
    client = TestClient(app, raise_server_exceptions=False)

    with patch_settings(aether_mode="development", dev_preview_enabled=False):
        response = client.get("/api/v1/system/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "development"
    assert payload["is_dev_preview"] is False
    assert payload["features"]["queuing"] is False


def test_system_config_allows_explicit_dev_preview():
    client = TestClient(app, raise_server_exceptions=False)

    with patch_settings(aether_mode="development", dev_preview_enabled=True):
        response = client.get("/api/v1/system/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["is_dev_preview"] is True


def test_logout_uses_safe_return_path_and_clears_cookie():
    client = TestClient(app, raise_server_exceptions=False)

    with patch_settings(session_cookie_name="aether_session", session_cookie_secure=False, session_cookie_samesite="lax"):
        response = client.get("/api/v1/auth/logout?return_to=/dashboard", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/dashboard"
    set_cookie = response.headers.get("set-cookie", "")
    assert "aether_session=" in set_cookie
    assert "Max-Age=0" in set_cookie or "expires=" in set_cookie.lower()


def test_logout_rejects_external_redirects():
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/api/v1/auth/logout?return_to=https://example.com", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/"
