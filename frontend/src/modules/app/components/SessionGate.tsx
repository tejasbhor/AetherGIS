import React, { useEffect, useMemo, useState } from 'react';
import { apiClient, useSystemConfig, type SystemConfig } from '@shared/api/client';
import { useStore } from '@app/store/useStore';
import { useSessionGuard } from '@shared/hooks/useSessionGuard';

interface SessionGateProps {
  children: React.ReactNode;
}

const PREVIEW_QUEUE_POSITION = 2;
const LOCAL_FALLBACK_CONFIG: SystemConfig = {
  mode: 'development',
  version: '2.0.0-local',
  gpu_support: false,
  is_dev_preview: false,
  features: {
    auth: false,
    queuing: false,
    mosdac_offline: true,
  },
};

// ─── Queue poll interval (ms) — snappy, but not hammering ───────────────────
// Queued users poll this fast so handover completes within 3–6 s of lock expiry.
const QUEUE_POLL_MS = 3000;

/** Animated satellite orbit rings */
const OrbitRings: React.FC = () => (
  <div className="ag-orbit-container" aria-hidden="true">
    <div className="ag-orbit ag-orbit-1" />
    <div className="ag-orbit ag-orbit-2" />
    <div className="ag-orbit ag-orbit-3" />
    <div className="ag-orbit-dot ag-orbit-dot-1" />
    <div className="ag-orbit-dot ag-orbit-dot-2" />
  </div>
);

/** Logo lockup */
const Logo: React.FC = () => (
  <div className="ag-logo" role="img" aria-label="AetherGIS">
    <svg className="ag-logo-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="url(#sg-grad)" strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="24" r="12" stroke="url(#sg-grad)" strokeWidth="1.5" opacity="0.9" />
      <circle cx="24" cy="24" r="4"  fill="url(#sg-grad)" />
      <ellipse cx="24" cy="24" rx="20" ry="8"  stroke="url(#sg-grad)" strokeWidth="1" opacity="0.4" />
      <ellipse cx="24" cy="24" rx="20" ry="14" stroke="url(#sg-grad)" strokeWidth="1" opacity="0.25" />
      <defs>
        <linearGradient id="sg-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2fd67c" />
        </linearGradient>
      </defs>
    </svg>
    <div className="ag-logo-text">
      <span className="ag-logo-name">AetherGIS</span>
      <span className="ag-logo-tagline">GeoAI Intelligence Platform</span>
    </div>
  </div>
);

/** Status badge */
const StatusBadge: React.FC<{ label: string; variant?: 'default' | 'warning' | 'error' }> = ({
  label,
  variant = 'default',
}) => (
  <div className={`ag-status-badge ag-status-badge--${variant}`} role="status">
    <span className="ag-status-dot" aria-hidden="true" />
    {label}
  </div>
);

/** Queue position progress track */
const QueueTrack: React.FC<{ position: number; total?: number }> = ({ position, total = 5 }) => {
  const filled = Math.max(0, total - position);
  return (
    <div className="ag-queue-track" aria-label={`Queue position ${position} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`ag-queue-segment ${i < filled ? 'ag-queue-segment--filled' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/** Idle timeout warning overlay — shown over the dashboard when idle. */
const IdleWarningOverlay: React.FC<{
  countdownSec: number;
  onDismiss: () => void;
}> = ({ countdownSec, onDismiss }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(2,8,22,0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}
    role="alertdialog"
    aria-modal="true"
    aria-label="Session idle timeout warning"
    aria-describedby="idle-warn-desc"
  >
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,20,50,0.98) 0%, rgba(5,12,30,0.98) 100%)',
      border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: 16,
      padding: '36px 40px',
      maxWidth: 420,
      textAlign: 'center',
      boxShadow: '0 0 60px rgba(245,158,11,0.15)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏱</div>
      <h2 style={{ color: '#f59e0b', fontFamily: 'var(--cond)', fontSize: 22, marginBottom: 8 }}>
        Session Idle Warning
      </h2>
      <p id="idle-warn-desc" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        No activity detected. Your session will be automatically released and given to the next user in{' '}
        <strong style={{ color: '#f59e0b' }}>{countdownSec} second{countdownSec !== 1 ? 's' : ''}</strong>.
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 24 }}>
        Move your mouse, press a key, or click below to stay active.
      </p>
      <button
        onClick={onDismiss}
        style={{
          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 28px',
          color: '#000',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
        autoFocus
      >
        I'm Still Here
      </button>
    </div>
  </div>
);


// ─── Main SessionGate ─────────────────────────────────────────────────────────
const SessionGate: React.FC<SessionGateProps> = ({ children }) => {
  const sessionId    = useStore((s) => s.sessionId);
  const isLocalHost  = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const { data: config, isLoading: configLoading } = useSystemConfig();
  const resolvedConfig = config ?? (isLocalHost ? LOCAL_FALLBACK_CONFIG : null);
  const [status, setStatus]             = useState<'loading' | 'granted' | 'waiting' | 'error'>('loading');
  const [queuePos, setQueuePos]         = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [activeUserHint, setActiveUserHint] = useState('');
  const [pollCount, setPollCount]       = useState(0);
  const [secondsUntilNext, setSecondsUntilNext] = useState(QUEUE_POLL_MS / 1000);

  const forceQueuePreview = useMemo(() => {
    if (!resolvedConfig?.is_dev_preview) return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('preview_queue') === 'true';
  }, [resolvedConfig?.is_dev_preview]);

  const queueEnabled = !!resolvedConfig && (resolvedConfig.features.queuing || forceQueuePreview);

  // Only active when the user has been granted access.
  const { idleCountdownSec, resetIdle } = useSessionGuard(
    sessionId,
    queueEnabled && status === 'granted',
  );

  // ── Queue polling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!resolvedConfig || configLoading) return;

    if (!queueEnabled) {
      setStatus('granted');
      return;
    }

    if (forceQueuePreview) {
      setStatus('waiting');
      setQueuePos(PREVIEW_QUEUE_POSITION);
      setEstimatedWait(PREVIEW_QUEUE_POSITION * 5);
      setActiveUserHint('preview');
      return;
    }

    let cancelled    = false;
    let pollTimer: number | undefined;
    let countdownTimer: number | undefined;

    const checkStatus = async () => {
      // Reset countdown display
      setSecondsUntilNext(QUEUE_POLL_MS / 1000);
      try {
        const { data } = await apiClient.get('/system/session/status', {
          params: { session_id: sessionId },
        });

        if (cancelled) return;

        if (data.status === 'granted') {
          setStatus('granted');
          setQueuePos(0);
          setEstimatedWait(0);
          setActiveUserHint('');
          if (pollTimer) window.clearInterval(pollTimer);
          if (countdownTimer) window.clearInterval(countdownTimer);
          return;
        }

        setStatus('waiting');
        setQueuePos(data.queue_pos ?? data.position ?? 0);
        setEstimatedWait(data.wait_time_est_min ?? data.estimated_wait_minutes ?? 0);
        setActiveUserHint(data.active_user_hint ?? '');
        setPollCount((c) => c + 1);
      } catch (err) {
        console.error('Session check failed', err);
        if (!cancelled) setStatus('error');
      }
    };

    // Start polling
    checkStatus();
    pollTimer = window.setInterval(checkStatus, QUEUE_POLL_MS);

    // Visual countdown for "next check in Xs"
    let ticksLeft = Math.floor(QUEUE_POLL_MS / 1000);
    countdownTimer = window.setInterval(() => {
      ticksLeft -= 1;
      setSecondsUntilNext(ticksLeft);
      if (ticksLeft <= 0) ticksLeft = Math.floor(QUEUE_POLL_MS / 1000);
    }, 1000);

    return () => {
      cancelled = true;
      if (pollTimer) window.clearInterval(pollTimer);
      if (countdownTimer) window.clearInterval(countdownTimer);
    };
  }, [configLoading, forceQueuePreview, queueEnabled, resolvedConfig, sessionId]);

  /* ── Loading ── */
  if ((!resolvedConfig && configLoading) || status === 'loading') {
    return (
      <div className="ag-gate-screen" role="main" aria-label="Initializing session control">
        <div className="ag-gate-bg" aria-hidden="true">
          <div className="ag-gate-bg-radial ag-gate-bg-radial-1" />
          <div className="ag-gate-bg-radial ag-gate-bg-radial-2" />
          <div className="ag-gate-bg-grid" />
        </div>

        <div className="ag-gate-card">
          <OrbitRings />
          <Logo />
          <div className="ag-gate-divider" aria-hidden="true" />

          <div className="ag-gate-loader-wrap" aria-busy="true">
            <div className="ag-gate-ring-spinner" aria-hidden="true">
              <div className="ag-gate-ring-inner" />
            </div>
            <div className="ag-gate-loader-text">
              <h1 className="ag-gate-title">Initializing Session Control</h1>
              <p className="ag-gate-copy">
                Configuring hardware access, session isolation, and AI pipeline availability.
              </p>
            </div>
          </div>

          <div className="ag-gate-progress-track" aria-hidden="true">
            <div className="ag-gate-progress-bar" />
          </div>

          <div className="ag-gate-meta">
            <StatusBadge label="Establishing secure session" />
          </div>
        </div>

        <div className="ag-gate-footer" aria-hidden="true">
          <span className="ag-gate-footer-text">v2.0 · Secure Production Build</span>
        </div>
      </div>
    );
  }

  /* ── Config Error ── */
  if (!resolvedConfig) {
    return (
      <div className="ag-gate-screen" role="main" aria-label="Configuration error">
        <div className="ag-gate-bg" aria-hidden="true">
          <div className="ag-gate-bg-radial ag-gate-bg-radial-error" />
          <div className="ag-gate-bg-grid" />
        </div>

        <div className="ag-gate-card ag-gate-card--error">
          <Logo />
          <div className="ag-gate-divider" aria-hidden="true" />

          <div className="ag-gate-error-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="ag-gate-title ag-gate-title--error">Session Control Offline</h1>
          <p className="ag-gate-copy">
            Unable to load deployment settings for the session manager. The API may be temporarily
            unavailable.
          </p>
          <StatusBadge label="Service disruption detected" variant="error" />

          <button
            className="ag-gate-retry-btn"
            onClick={() => window.location.reload()}
            aria-label="Retry connection"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /* ── Queue Waiting ── */
  if (status === 'waiting') {
    const waitMins = estimatedWait || Math.max(1, Math.ceil(queuePos * 0.75)) || 1;
    return (
      <div className="ag-gate-screen" role="main" aria-label={`Queue position ${queuePos}`}>
        <div className="ag-gate-bg" aria-hidden="true">
          <div className="ag-gate-bg-radial ag-gate-bg-radial-queue" />
          <div className="ag-gate-bg-radial ag-gate-bg-radial-2" />
          <div className="ag-gate-bg-grid" />
        </div>

        <div className="ag-gate-card ag-gate-card--queue">
          <Logo />
          <div className="ag-gate-divider" aria-hidden="true" />

          {/* Queue icon */}
          <div className="ag-queue-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>

          <h1 className="ag-gate-title">Pipeline Controller Busy</h1>
          <p className="ag-gate-copy">
            AetherGIS runs one active session at a time to ensure stable interpolation performance
            and complete data isolation. You've been placed in the access queue.
          </p>

          {/* Queue metrics */}
          <div className="ag-queue-metrics" role="region" aria-label="Queue status">
            <div className="ag-queue-metric">
              <span className="ag-queue-metric-value" aria-label={`Position ${queuePos} in queue`}>
                #{queuePos || '?'}
              </span>
              <span className="ag-queue-metric-label">Your Position</span>
            </div>
            <div className="ag-queue-metric-divider" aria-hidden="true" />
            <div className="ag-queue-metric">
              <span className="ag-queue-metric-value">~{waitMins}m</span>
              <span className="ag-queue-metric-label">Est. Wait</span>
            </div>
            <div className="ag-queue-metric-divider" aria-hidden="true" />
            <div className="ag-queue-metric">
              <span
                className="ag-queue-metric-value ag-queue-metric-value--mono"
                aria-label={`Active user: ${activeUserHint ? activeUserHint + '...' : 'protected'}`}
              >
                {activeUserHint ? `${activeUserHint}…` : '••••••'}
              </span>
              <span className="ag-queue-metric-label">Active User</span>
            </div>
          </div>

          {/* Visual queue position track */}
          <QueueTrack position={queuePos} />

          <div className="ag-gate-meta">
            <StatusBadge label="Auto-granted when session is free" variant="warning" />
          </div>

          <p className="ag-gate-copy ag-gate-copy--small">
            This page checks automatically every {QUEUE_POLL_MS / 1000} seconds — no need to refresh.
            {pollCount > 0 && (
              <span className="ag-gate-poll-count" aria-live="polite">
                {' '}Next check in {secondsUntilNext}s.
              </span>
            )}
          </p>
        </div>

        <div className="ag-gate-footer" aria-hidden="true">
          <span className="ag-gate-footer-text">v2.0 · Secure Production Build</span>
        </div>
      </div>
    );
  }

  /* ── Connection Error ── */
  if (status === 'error') {
    return (
      <div className="ag-gate-screen" role="main" aria-label="Connection error">
        <div className="ag-gate-bg" aria-hidden="true">
          <div className="ag-gate-bg-radial ag-gate-bg-radial-error" />
          <div className="ag-gate-bg-grid" />
        </div>

        <div className="ag-gate-card ag-gate-card--error">
          <Logo />
          <div className="ag-gate-divider" aria-hidden="true" />

          <div className="ag-gate-error-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="ag-gate-title ag-gate-title--error">Connection Failed</h1>
          <p className="ag-gate-copy">
            Unable to communicate with the AetherGIS Session Manager. The processing backend may be
            restarting or temporarily unavailable.
          </p>
          <StatusBadge label="Session manager unreachable" variant="error" />

          <button
            className="ag-gate-retry-btn"
            onClick={() => window.location.reload()}
            aria-label="Retry connection to session manager"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /* ── Granted: show dashboard + idle warning if triggered ── */
  return (
    <>
      {idleCountdownSec !== null && (
        <IdleWarningOverlay countdownSec={idleCountdownSec} onDismiss={resetIdle} />
      )}
      {children}
    </>
  );
};

export default SessionGate;
