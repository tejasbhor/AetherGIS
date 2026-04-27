/**
 * AetherGIS — Server-level status banner and connection error state.
 * Shown below the toolbar if the backend is unreachable.
 */
import { useHealth } from '@shared/api/client';

export default function ServerStatus() {
  const { data: health, isLoading, isError } = useHealth();

  // Backend is down
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
          Cannot connect to AetherGIS API server at {window.location.hostname}:8000 — Pipeline functions are disabled.
        </span>
        <span
          style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline', color: 'var(--red)' }}
          onClick={() => window.location.reload()}
        >Retry</span>
      </div>
    );
  }

  // Partial service degradation (no FILM model — the primary model)
  if (health && !health.film_model_loaded) {
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
        <strong>AI MODELS NOT LOADED</strong>
        <span style={{ color: 'var(--t2)' }}>
          — No interpolation models available. Run <code style={{ background: 'var(--panel-hdr)', padding: '0 4px', borderRadius: 2 }}>python scripts/setup_models.py</code> to enable.
        </span>
      </div>
    );
  }

  return null;
}
