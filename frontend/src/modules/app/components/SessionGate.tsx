import React, { useEffect, useState } from 'react';
import { useSystemConfig, apiClient } from '@shared/api/client';
import { useStore } from '@app/store/useStore';
import { Loader2, Users, Clock, ShieldAlert } from 'lucide-react';

interface SessionGateProps {
  children: React.ReactNode;
}

const SessionGate: React.FC<SessionGateProps> = ({ children }) => {
  const sessionId = useStore((s) => s.sessionId);
  const { data: config } = useSystemConfig();
  const [status, setStatus] = useState<'loading' | 'granted' | 'waiting' | 'error'>('loading');
  const [queuePos, setQueuePos] = useState(0);
  const [activeUserHint, setActiveUserHint] = useState('');

  useEffect(() => {
    if (!config) return;

    // If not in production, grant access immediately
    if (config.mode !== 'production') {
      setStatus('granted');
      return;
    }

    let pollInterval: number;

    const checkStatus = async () => {
      try {
        const { data } = await apiClient.get('/system/session/status', {
          params: { session_id: sessionId }
        });

        if (data.status === 'granted') {
          setStatus('granted');
          clearInterval(pollInterval);
        } else {
          setStatus('waiting');
          setQueuePos(data.queue_pos);
          setActiveUserHint(data.active_user_hint);
        }
      } catch (err) {
        console.error('Session check failed', err);
        setStatus('error');
      }
    };

    checkStatus();
    pollInterval = window.setInterval(checkStatus, 5000);

    return () => clearInterval(pollInterval);
  }, [config, sessionId]);

  // Heartbeat loop (only if granted and in production)
  useEffect(() => {
    if (status !== 'granted' || config?.mode !== 'production') return;

    const interval = setInterval(() => {
      apiClient.post('/system/session/heartbeat', null, {
        params: { session_id: sessionId }
      }).catch(err => console.warn('Heartbeat failed', err));
    }, 15000);

    return () => clearInterval(interval);
  }, [status, config, sessionId]);

  if (status === 'loading') {
    return (
      <div className="gate-screen">
        <Loader2 className="gate-loader" />
        <p>Initializing AetherGIS Session...</p>
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
            AetherGIS is currently restricted to one concurrent user to ensure maximum 
            GPU performance for the GeoAI engine.
          </p>
          
          <div className="queue-status">
            <div className="queue-item">
              <span className="queue-label">Your Position</span>
              <span className="queue-value">#{queuePos}</span>
            </div>
            <div className="queue-item">
              <span className="queue-label">Current User</span>
              <span className="queue-value text-mono">{activeUserHint}...</span>
            </div>
          </div>

          <div className="wait-indicator">
            <Clock size={16} />
            <span>Estimated wait: ~{queuePos * 5} mins</span>
          </div>

          <div className="gate-footer">
            <p>We will automatically grant access when it's your turn. Do not close this tab.</p>
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
          <button className="gate-btn" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionGate;
