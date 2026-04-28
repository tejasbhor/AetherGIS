/**
 * AetherGIS — Server-level status banner and connection error state.
 * Shown below the toolbar if the backend is unreachable.
 *
 * FLAG LOGIC:
 *   - BACKEND OFFLINE: health endpoint unreachable (hard error)
 *   - CPU FALLBACK MODE: film_model_loaded=false BUT server is healthy → LK optical
 *     flow is running as designed; show a soft info note, not a scary warning.
 *   - We intentionally suppress GPU warnings since the OCI instance has no CUDA;
 *     CPU fallback is the expected production mode on this host.
 */
import { useHealth } from '@shared/api/client';

export default function ServerStatus() {
  const { data: health, isLoading, isError } = useHealth();

  // ── Backend is completely down ──────────────────────────────────────────────
  if (isError && !isLoading) {
    return (
      <div style={{
        background: 'var(--red-bg)',
        borderBottom: '1px solid var(--red-lt)',
        padding: '4px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--red)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span>⚠</span>
        <strong>BACKEND OFFLINE</strong>
        <span style={{ color: 'var(--t4)' }}>—</span>
        <span style={{ color: 'var(--t2)' }}>
          Cannot connect to AetherGIS API at {window.location.hostname} — Pipeline functions are disabled.
        </span>
        <span
          style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline', color: 'var(--red)' }}
          onClick={() => window.location.reload()}
        >Retry</span>
      </div>
    );
  }

  // ── CPU Optical Flow mode (FILM/RIFE weights not present — graceful degradation) ──
  // The pipeline ran correctly. LK optical flow fallback is active by design on
  // CPU-only hosts (no CUDA). This is an informational note, not a warning.
  if (health && !health.film_model_loaded && health.db_connected && health.redis_connected) {
    return (
      <div style={{
        background: 'var(--blue-bg)',
        borderBottom: '1px solid var(--blue-lt)',
        padding: '4px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--blue)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span aria-hidden="true">ℹ</span>
        <strong>CPU Interpolation Mode</strong>
        <span style={{ color: 'var(--t3)' }}>
          — Deep learning weights not present on this host. Running on CPU optical flow fallback (Lucas-Kanade). Pipeline output is valid.
        </span>
      </div>
    );
  }

  // ── Degraded: model missing AND infrastructure also unhealthy ───────────────
  if (health && !health.film_model_loaded && (!health.db_connected || !health.redis_connected)) {
    return (
      <div style={{
        background: 'var(--orng-bg)',
        borderBottom: '1px solid var(--orng-lt)',
        padding: '4px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--orange)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span>⚠</span>
        <strong>SERVICE DEGRADED</strong>
        <span style={{ color: 'var(--t2)' }}>
          — Infrastructure partially offline. Pipeline may be unreliable.
        </span>
      </div>
    );
  }

  return null;
}
