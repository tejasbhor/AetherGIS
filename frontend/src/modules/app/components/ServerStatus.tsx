/**
 * AetherGIS — Server-level status banner and connection error state.
 * Shown below the toolbar if the backend reports a problem.
 *
 * FLAG PRIORITY (highest → lowest):
 *   1. BACKEND OFFLINE:  health endpoint unreachable (hard error — red)
 *   2. INFRA DEGRADED:   health endpoint reachable but redis/db down (orange)
 *   3. CPU FALLBACK:     health.cpu_fallback_mode = true — DL weights absent,
 *                        LK optical flow active, infra healthy (blue info note)
 *   4. null:             all systems nominal — banner hidden
 *
 * DESIGN NOTE:
 *   On OCI ARM64 (no CUDA), cpu_fallback_mode is always true.
 *   This is the expected production state — the banner is purely informational.
 *   It must never show orange/red on a healthy CPU-only host.
 */
import { useHealth } from '@shared/api/client';

export default function ServerStatus() {
  const { data: health, isLoading, isError } = useHealth();

  // ── 1. Backend completely unreachable ────────────────────────────────────
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
          Cannot connect to AetherGIS API — Pipeline functions are disabled.
        </span>
        <span
          style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline', color: 'var(--red)' }}
          onClick={() => window.location.reload()}
        >Retry</span>
      </div>
    );
  }

  // ── 2. Infra degraded (Redis or DB down) — actual problem ───────────────
  // Only show this when infra is truly unhealthy, NOT for missing DL weights.
  if (health && (!health.redis_connected || !health.db_connected)) {
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
          {!health.redis_connected && !health.db_connected
            ? '— Redis and database both offline. Pipeline functions unavailable.'
            : !health.redis_connected
            ? '— Redis offline. Queue and session features unavailable.'
            : '— Database offline. Session history unavailable.'}
        </span>
      </div>
    );
  }

  // ── 3. CPU fallback mode (no DL weights, infra healthy) — info only ──────
  // The backend explicitly sets cpu_fallback_mode=true when LK optical flow
  // is active and everything else is healthy. Show a neutral blue note.
  if (health?.cpu_fallback_mode) {
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
          — Running on Lucas-Kanade optical flow (no CUDA on this host). Pipeline output is valid and all systems are healthy.
        </span>
      </div>
    );
  }

  // ── 4. All good ─────────────────────────────────────────────────────────
  return null;
}
