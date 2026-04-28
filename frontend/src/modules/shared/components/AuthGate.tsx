import React, { useEffect } from 'react';
import type { SystemConfig } from '@shared/api/client';
import { useAuth, useSystemConfig, getLoginUrl } from '@shared/api/client';

interface AuthGateProps {
  children: React.ReactNode;
}

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

/** Animated satellite orbit rings — purely decorative, aria-hidden */
const OrbitRings: React.FC = () => (
  <div className="ag-orbit-container" aria-hidden="true">
    <div className="ag-orbit ag-orbit-1" />
    <div className="ag-orbit ag-orbit-2" />
    <div className="ag-orbit ag-orbit-3" />
    <div className="ag-orbit-dot ag-orbit-dot-1" />
    <div className="ag-orbit-dot ag-orbit-dot-2" />
  </div>
);

/** Reusable logo lockup */
const Logo: React.FC = () => (
  <div className="ag-logo" role="img" aria-label="AetherGIS">
    <svg className="ag-logo-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="url(#ag-grad)" strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="24" r="12" stroke="url(#ag-grad)" strokeWidth="1.5" opacity="0.9" />
      <circle cx="24" cy="24" r="4"  fill="url(#ag-grad)" />
      <ellipse cx="24" cy="24" rx="20" ry="8"  stroke="url(#ag-grad)" strokeWidth="1" opacity="0.4" />
      <ellipse cx="24" cy="24" rx="20" ry="14" stroke="url(#ag-grad)" strokeWidth="1" opacity="0.25" />
      <defs>
        <linearGradient id="ag-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
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

/** Status badge pill */
const StatusBadge: React.FC<{ label: string; variant?: 'default' | 'warning' | 'error' }> = ({
  label,
  variant = 'default',
}) => (
  <div className={`ag-status-badge ag-status-badge--${variant}`} role="status">
    <span className="ag-status-dot" aria-hidden="true" />
    {label}
  </div>
);

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const { data: config, isLoading: configLoading } = useSystemConfig();
  const resolvedConfig = config ?? (isLocalHost ? LOCAL_FALLBACK_CONFIG : null);
  const requiresAuth = !!resolvedConfig && (resolvedConfig.features.auth || resolvedConfig.is_dev_preview);
  const { data: auth, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!resolvedConfig || configLoading || authLoading || !requiresAuth) return;
    if (!auth?.authenticated) {
      window.location.assign(getLoginUrl());
    }
  }, [auth?.authenticated, authLoading, configLoading, requiresAuth, resolvedConfig]);

  /* ── Loading / Initializing ── */
  if ((!resolvedConfig && configLoading) || (requiresAuth && authLoading)) {
    return (
      <div className="ag-gate-screen" role="main" aria-label="Initializing AetherGIS">
        {/* Background mesh */}
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
              <h1 className="ag-gate-title">Initializing AetherGIS 2.0</h1>
              <p className="ag-gate-copy">
                Syncing deployment mode, authentication state, and dashboard capabilities.
              </p>
            </div>
          </div>

          <div className="ag-gate-progress-track" aria-hidden="true">
            <div className="ag-gate-progress-bar" />
          </div>

          <div className="ag-gate-meta">
            <StatusBadge label="Connecting to secure API" />
          </div>
        </div>

        {/* Bottom version badge */}
        <div className="ag-gate-footer" aria-hidden="true">
          <span className="ag-gate-footer-text">v2.0 · Secure Production Build</span>
        </div>
      </div>
    );
  }

  /* ── Config unavailable ── */
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

          <h1 className="ag-gate-title ag-gate-title--error">Configuration Unavailable</h1>
          <p className="ag-gate-copy">
            The dashboard could not load its deployment configuration from the API.
            This may indicate a service disruption.
          </p>

          <StatusBadge label="API unreachable" variant="error" />

          <button
            className="ag-gate-retry-btn"
            onClick={() => window.location.reload()}
            aria-label="Retry connection to AetherGIS API"
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

  /* ── Unauthenticated / redirecting ── */
  if (!requiresAuth) {
    return <>{children}</>;
  }

  if (!auth?.authenticated) {
    return (
      <div className="ag-gate-screen" role="main" aria-label="Redirecting to sign in">
        <div className="ag-gate-bg" aria-hidden="true">
          <div className="ag-gate-bg-radial ag-gate-bg-radial-1" />
          <div className="ag-gate-bg-radial ag-gate-bg-radial-2" />
          <div className="ag-gate-bg-grid" />
        </div>

        <div className="ag-gate-card">
          <OrbitRings />
          <Logo />
          <div className="ag-gate-divider" aria-hidden="true" />

          <div className="ag-gate-loader-wrap">
            <div className="ag-gate-ring-spinner" aria-hidden="true">
              <div className="ag-gate-ring-inner" />
            </div>
            <div className="ag-gate-loader-text">
              <h1 className="ag-gate-title">Redirecting to Secure Sign-In</h1>
              <p className="ag-gate-copy">
                This deployment requires authentication before the GeoAI dashboard can be opened.
              </p>
            </div>
          </div>

          <div className="ag-gate-progress-track" aria-hidden="true">
            <div className="ag-gate-progress-bar" />
          </div>

          <div className="ag-gate-meta">
            <StatusBadge label="Authenticating via Google" />
          </div>

          <p className="ag-gate-hint">
            Not redirecting?{' '}
            <a href={getLoginUrl()} className="ag-gate-link" aria-label="Manually open Google sign in">
              Click here to sign in manually
            </a>
          </p>
        </div>

        <div className="ag-gate-footer" aria-hidden="true">
          <span className="ag-gate-footer-text">v2.0 · Secure Production Build</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
