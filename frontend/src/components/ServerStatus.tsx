/**
 * AetherGIS — Server-level status banner and connection error state.
 * Shown below the toolbar if the backend is unreachable.
 */
import { useHealth } from '../api/client';

export default function ServerStatus() {
  const { data: health, isLoading, isError } = useHealth();

  // Backend is down
  if (isError && !isLoading) {
    return (
      <div style={{
        background: '#b82020',
        borderBottom: '1px solid #8a1010',
        padding: '4px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span>⚠</span>
        <strong>BACKEND OFFLINE</strong>
        <span style={{ color: 'rgba(255,255,255,0.8)' }}>—</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>
          Cannot connect to AetherGIS API server at {window.location.hostname}:8000 — Pipeline functions are disabled.
        </span>
        <span
          style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline', color: 'rgba(255,255,255,0.8)' }}
          onClick={() => window.location.reload()}
        >Retry</span>
      </div>
    );
  }

  // Partial service degradation (no FILM model — the primary model)
  if (health && !health.film_model_loaded) {
    return (
      <div style={{
        background: '#c06010',
        borderBottom: '1px solid #8a4010',
        padding: '4px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span>⚠</span>
        <strong>AI MODELS NOT LOADED</strong>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>
          — No interpolation models available. Run <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0 4px', borderRadius: 2 }}>python scripts/setup_models.py</code> to enable.
        </span>
      </div>
    );
  }

  return null;
}
