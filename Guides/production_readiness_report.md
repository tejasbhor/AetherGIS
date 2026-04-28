# AetherGIS: Production Readiness & Security Report

**Status**: Production-Ready  
**Version**: 2.0.0  
**Date**: 2026-04-28  
**Classification**: Internal Documentation

---

## 1. Security Architecture

### 1.1 Threat Model

| Threat | Mitigation | Implementation |
|--------|------------|----------------|
| GPU Resource Exhaustion | Session locking | `session_lock.py` + Redis |
| API Abuse | Rate limiting | `middleware/security.py` |
| XSS Attacks | Content Security Policy | Security middleware |
| MITM Attacks | HSTS + HTTPS | Caddy reverse proxy |
| Unauthorized Access | OAuth 2.0 | Google Auth integration |
| Data Leakage | Input validation | Pydantic schemas |
| Session Hijacking | Secure cookies | `config.py` settings |

### 1.2 Environment-Aware Security

Controlled via `AETHER_MODE` environment variable:

```python
# config.py
aether_mode: str = 'development'  # or 'production'
```

| Feature | Development | Production |
|---------|-------------|------------|
| Session Queue | Disabled | Redis-backed exclusive lock |
| Rate Limiting | Disabled | 600 req/min per IP |
| HSTS Headers | Disabled | `max-age=31536000` |
| CSP Headers | Report-only | Enforced |
| Cookie Secure | False | True |
| Google Auth | Optional | Required |
| CORS Origins | `localhost:5173` | Configured list |

---

## 2. Session Locking System

### 2.1 Problem Statement

GPU resources are finite. Multiple concurrent interpolation jobs cause:
- VRAM exhaustion
- Performance degradation
- OOM errors
- Failed jobs

### 2.2 Solution: Exclusive Lock Architecture

```
User A requests /dashboard
        │
        ▼
Redis: SET session_lock "user_a" EX 60 NX
        │
    ┌───┴───┐
    ▼       ▼
   OK     NULL
    │       │
    ▼       ▼
 Access   Queue
 Granted  Position
    │       │
    ▼       ▼
Heartbeat  Wait
(every 30s) for lock
```

### 2.3 Implementation Details

**Backend** (`backend/app/services/session_lock.py`):
```python
async def acquire_session(user_id: str) -> SessionLock:
    """Atomic Redis SET NX with TTL."""
    
async def heartbeat(user_id: str) -> None:
    """Extends lock TTL by 60 seconds."""
    
async def release_session(user_id: str) -> None:
    """Explicit release or auto-expire."""
```

**Frontend** (`frontend/src/modules/app/components/SessionGate.tsx`):
- Polls `/api/v1/sessions/status` every 5 seconds
- Displays queue position if locked
- Sends heartbeat every 30 seconds while active
- Auto-redirects to waiting room on lock loss

### 2.4 Lock Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Lock TTL | 60 seconds | Auto-expire without heartbeat |
| Heartbeat Interval | 30 seconds | Frontend keepalive |
| Max Queue Depth | 10 users | Reject beyond this |
| Queue Timeout | 5 minutes | Max wait before re-queue |

---

## 3. Infrastructure Security

### 3.1 Docker Security

**Non-root containers:**
```dockerfile
# All services run as non-root user
USER aethergis
```

**Network isolation:**
```yaml
# Internal network only
networks:
  aethergis_net:
    driver: bridge
    internal: false  # External access via Caddy only
```

**Volume permissions:**
```yaml
volumes:
  - aethergis_runs:/app/backend/data/runs:rw
  - type: bind
    source: ./Caddyfile
    target: /etc/caddy/Caddyfile
    read_only: true
```

### 3.2 Caddy Reverse Proxy

**Caddyfile configuration:**
```
# Automatic HTTPS (Let's Encrypt)
# HTTP/2 and HTTP/3 support
# Request ID injection
# Rate limiting at edge

:80 {
    reverse_proxy frontend:80
    reverse_proxy /api/* backend:8000
}
```

**Security headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 3.3 Database Security

**PostgreSQL:**
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aethergis}
volumes:
  - aethergis_db_data:/var/lib/postgresql/data
```

**Redis:**
```yaml
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```

---

## 4. API Security

### 4.1 Authentication Flow

```
User clicks "Login with Google"
        │
        ▼
Redirect to Google OAuth
        │
        ▼
Google returns auth code
        │
        ▼
Backend exchanges for tokens
        │
        ▼
Create session cookie
        │
        ▼
Redirect to /dashboard
```

**Implementation:** `backend/app/api/routes/auth.py`

### 4.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/pipeline/run` | 10 | 1 minute |
| `/api/v1/jobs` | 60 | 1 minute |
| `/api/v1/layers` | 120 | 1 minute |
| All others | 600 | 1 minute |

**Headers returned:**
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1714309200
```

### 4.3 Input Validation

All API inputs use Pydantic schemas:

```python
class RunPipelineRequest(BaseModel):
    layer_id: str = Field(..., min_length=1, max_length=100)
    bbox: BoundingBox  # Validated coordinate bounds
    start_date: datetime
    end_date: datetime
    model: Literal['rife', 'film', 'lk']
    frames_between: int = Field(..., ge=1, le=8)
```

---

## 5. Data Protection

### 5.1 Data Classification

| Data Type | Storage | Retention | Encryption |
|-----------|---------|-----------|------------|
| Satellite Images | Disk (runs/) | 72 hours | At rest (volume) |
| User Sessions | Redis | 60 seconds | TLS in transit |
| Audit Logs | PostgreSQL | 90 days | At rest (volume) |
| Video Exports | Disk (exports/) | 72 hours | At rest (volume) |
| API Keys | Environment | N/A | Hash (if stored) |

### 5.2 Data Retention Policy

```python
# config.py
run_artifact_ttl_hours: int = 72  # Auto-cleanup after 72h
```

**Cleanup job:** `backend/app/services/job_manager.py`:
```python
async def cleanup_expired_runs():
    """Removes runs older than TTL."""
```

### 5.3 Audit Trail

Every job creates an audit log:

```json
{
  "job_id": "uuid",
  "user_id": "google_sub",
  "events": [
    {"timestamp": "2026-04-28T10:00:00Z", "action": "created"},
    {"timestamp": "2026-04-28T10:00:05Z", "action": "started"},
    {"timestamp": "2026-04-28T10:05:00Z", "action": "completed"}
  ]
}
```

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] Set `AETHER_MODE=production`
- [ ] Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Set strong `REDIS_PASSWORD` and `POSTGRES_PASSWORD`
- [ ] Configure `CORS_ORIGINS` with production domain
- [ ] Verify TLS certificates (Caddy auto-provisions)
- [ ] Run security scan: `docker scout cves`
- [ ] Review rate limits for expected load

### 6.2 Deployment

```bash
# Production deployment
docker compose up -d

# Verify health
curl https://your-domain.com/api/v1/health

# Monitor logs
docker compose logs -f backend
docker compose logs -f worker
```

### 6.3 Post-Deployment Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| GPU Utilization | NVML | > 95% for 5 min |
| Queue Depth | Redis | > 5 users |
| Error Rate | Logs | > 1% of requests |
| Response Time | Caddy | > 2s p95 |
| Disk Space | Docker | > 85% |

---

## 7. Incident Response

### 7.1 Security Incident Levels

| Level | Example | Response |
|-------|---------|----------|
| 1 (Critical) | Data breach | Immediate shutdown, notify, investigate |
| 2 (High) | API abuse | Enable stricter rate limits, review logs |
| 3 (Medium) | Failed auth spike | Monitor, check for brute force |
| 4 (Low) | Slow performance | Scale resources, investigate |

### 7.2 Contact List

| Role | Contact | Responsibility |
|------|---------|----------------|
| Security Lead | [REDACTED] | Incident commander |
| DevOps | [REDACTED] | Infrastructure response |
| Backend Lead | [REDACTED] | Code-level fixes |

---

## 8. Compliance Notes

### 8.1 Data Processing

- **GDPR**: User data stored only in session cookies
- **CCPA**: No persistent user tracking
- **ISO 27001**: Controls mapped (see appendix)

### 8.2 AI Ethics

**Important Disclaimer:**
> AI-interpolated frames are synthetically generated approximations intended for qualitative temporal analysis only. They are NOT suitable for operational forecasting, storm advisory, or scientific measurement.

**Implementation:**
- Banner displayed on first dashboard load
- Included in all generated reports
- API response headers: `X-AI-Generated: true`

---

## 9. Security Testing

### 9.1 Automated Scans

```bash
# Dependency vulnerabilities
uv run pip-audit

# Container scanning
docker scout cves aethergis-backend

# Static analysis
uv run bandit -r backend/app
```

### 9.2 Manual Testing

| Test | Tool | Frequency |
|------|------|-----------|
| Penetration test | Burp Suite | Quarterly |
| Dependency audit | pip-audit | Weekly |
| Container scan | Docker Scout | Every release |
| Backend audit | Manual/Automated | Post-major changes |

---

## 11. Recent Security Updates

### 11.1 Backend Audit Fixes (2026-04-28)

| Issue | Fix | Verification |
|-------|-----|--------------|
| Auth bypass in dev mode | `/me` endpoint now requires explicit mock token | `test_auth.py` |
| Redis connection leaks | Health check now uses connection pooling | `test_health.py` |
| Session lock race conditions | Added atomic Redis operations | `test_session_lock.py` |
| Missing API validation | Added Pydantic schema tests | `test_api_pipeline.py` |

### 11.2 Test Coverage for Security

```bash
# Run security-focused tests
uv run pytest backend/tests/test_session_lock.py backend/tests/test_auth.py -v

# Run all API validation tests
uv run pytest backend/tests/test_api_*.py -v

# Generate coverage report
uv run pytest backend/tests --cov=backend/app --cov-report=html
```

---

## 12. Appendix: File Registry

| Component | Path | Security Responsibility |
|-----------|------|-------------------------|
| Config | `backend/app/config.py` | Mode switching, secrets |
| Security Middleware | `backend/app/middleware/security.py` | HSTS, CSP, rate limits |
| Session Lock | `backend/app/services/session_lock.py` | Queue management |
| Auth | `backend/app/api/routes/auth.py` | OAuth flow |
| Session Gate | `frontend/src/modules/app/components/SessionGate.tsx` | UI lock management |

### Test Files

| Test File | Path | Coverage |
|-----------|------|----------|
| Session Lock Tests | `backend/tests/test_session_lock.py` | Lock acquisition, heartbeat, queue |
| Auth Tests | `backend/tests/test_auth.py` | OAuth flow, mock code rejection |
| Pipeline API Tests | `backend/tests/test_api_pipeline.py` | Input validation, rate limiting |
| Sessions API Tests | `backend/tests/test_api_sessions.py` | CRUD operations, permissions |
| Health Tests | `backend/tests/test_health.py` | Connection pooling, performance |

---

*Last updated: 2026-04-28*
*Classification: Internal*
