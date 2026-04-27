import React, { useEffect, useMemo, useState } from 'react';
import { apiClient, useSystemConfig, type SystemConfig } from '@shared/api/client';
import { useStore } from '@app/store/useStore';
import { Loader2, Users, Clock, ShieldAlert } from 'lucide-react';

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

const SessionGate: React.FC<SessionGateProps> = ({ children }) => {
  const sessionId = useStore((s) => s.sessionId);
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const { data: config, isLoading: configLoading } = useSystemConfig();
  const resolvedConfig = config ?? (isLocalHost ? LOCAL_FALLBACK_CONFIG : null);
  const [status, setStatus] = useState<'loading' | 'granted' | 'waiting' | 'error'>('loading');
  const [queuePos, setQueuePos] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [activeUserHint, setActiveUserHint] = useState('');

  const forceQueuePreview = useMemo(() => {
    if (!resolvedConfig?.is_dev_preview) return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('preview_queue') === 'true';
  }, [resolvedConfig?.is_dev_preview]);

  const queueEnabled = !!resolvedConfig && (resolvedConfig.features.queuing || forceQueuePreview);

  useEffect(() => {
    if (!resolvedConfig || configLoading) return;

    if (!queueEnabled) {
      setStatus('granted');
      setQueuePos(0);
      setEstimatedWait(0);
      setActiveUserHint('');
      return;
    }

    if (forceQueuePreview) {
      setStatus('waiting');
      setQueuePos(PREVIEW_QUEUE_POSITION);
      setEstimatedWait(PREVIEW_QUEUE_POSITION * 5);
      setActiveUserHint('preview');
      return;
    }

    let cancelled = false;
    let pollInterval: number | undefined;

    const checkStatus = async () => {
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
          if (pollInterval) window.clearInterval(pollInterval);
          return;
        }

        setStatus('waiting');
        setQueuePos(data.queue_pos ?? data.position ?? 0);
        setEstimatedWait(data.wait_time_est_min ?? data.estimated_wait_minutes ?? 0);
        setActiveUserHint(data.active_user_hint ?? '');
      } catch (err) {
        console.error('Session check failed', err);
        if (!cancelled) setStatus('error');
      }
    };

    checkStatus();
    pollInterval = window.setInterval(checkStatus, 5000);

    return () => {
      cancelled = true;
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [configLoading, forceQueuePreview, queueEnabled, resolvedConfig, sessionId]);

  useEffect(() => {
    if (!queueEnabled || forceQueuePreview || status !== 'granted') return;

    const interval = window.setInterval(() => {
      apiClient.post('/system/session/heartbeat', null, {
        params: { session_id: sessionId },
      }).catch((err) => console.warn('Heartbeat failed', err));
    }, 15000);

    return () => window.clearInterval(interval);
  }, [forceQueuePreview, queueEnabled, sessionId, status]);

  if ((!resolvedConfig && configLoading) || status === 'loading') {
    return (
      <div className="gate-screen">
        <Loader2 className="gate-loader" />
        <p>Initializing AetherGIS session control...</p>
      </div>
    );
  }

  if (!resolvedConfig) {
    return (
      <div className="gate-screen">
        <div className="gate-card border-error">
          <ShieldAlert size={32} className="text-error" />
          <h2>Configuration Error</h2>
          <p>Unable to load deployment settings for the session manager.</p>
        </div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="gate-screen">
        <div className="gate-card">
          <div className="gate-icon-box">
            <Users size={32} className="text-primary" />
          </div>
          <h2>System Busy</h2>
          <p className="gate-text">
            AetherGIS keeps one active controller on the GPU in deployed mode so interpolation
            performance and session isolation stay stable.
          </p>

          <div className="queue-status">
            <div className="queue-item">
              <span className="queue-label">Your Position</span>
              <span className="queue-value">#{queuePos || '?'}</span>
            </div>
            <div className="queue-item">
              <span className="queue-label">Current User</span>
              <span className="queue-value text-mono">
                {activeUserHint ? `${activeUserHint}...` : 'Protected'}
              </span>
            </div>
          </div>

          <div className="wait-indicator">
            <Clock size={16} />
            <span>Estimated wait: ~{estimatedWait || queuePos * 5 || 5} mins</span>
          </div>

          <div className="gate-footer">
            <p>Access is granted automatically when hardware becomes available.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="gate-screen">
        <div className="gate-card border-error">
          <ShieldAlert size={32} className="text-error" />
          <h2>Connection Error</h2>
          <p>Failed to communicate with the AetherGIS Session Manager.</p>
          <button className="gate-btn" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionGate;
