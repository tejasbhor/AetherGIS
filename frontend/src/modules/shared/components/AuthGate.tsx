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

  if ((!resolvedConfig && configLoading) || (requiresAuth && authLoading)) {
    return (
      <div className="auth-gate-screen">
        <div className="auth-gate-card">
          <div className="auth-gate-spinner" aria-hidden="true" />
          <div className="auth-gate-title">Initializing AetherGIS 2.0</div>
          <p className="auth-gate-copy">
            Syncing deployment mode, authentication state, and dashboard capabilities.
          </p>
        </div>
      </div>
    );
  }

  if (!resolvedConfig) {
    return (
      <div className="auth-gate-screen">
        <div className="auth-gate-card">
          <div className="auth-gate-title">Configuration unavailable</div>
          <p className="auth-gate-copy">
            The dashboard could not load its deployment configuration from the API.
          </p>
        </div>
      </div>
    );
  }

  if (!requiresAuth) {
    return <>{children}</>;
  }

  if (!auth?.authenticated) {
    return (
      <div className="auth-gate-screen">
        <div className="auth-gate-card">
          <div className="auth-gate-title">Redirecting to secure sign-in</div>
          <p className="auth-gate-copy">
            This deployment requires authentication before the dashboard can be opened.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
