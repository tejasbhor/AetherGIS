import React, { useEffect, useState } from 'react';
import { useAuth, useSystemConfig, apiClient } from '@shared/api/client';
import { useStore } from '@app/store/useStore';

interface AuthGateProps {
  children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const sessionId = useStore((s) => s.sessionId);
  const { data: config, isLoading: configLoading } = useSystemConfig();
  const { data: auth, isLoading: authLoading } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'granted' | 'waiting' | 'error'>('checking');
  const [queueInfo, setQueueInfo] = useState<any>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const [forceQueue, setForceQueue] = useState(urlParams.get('preview_queue') === 'true');
  
  // Extra security: even if the param is true, we only allow it if the backend says we're in preview mode
  const isSaaSPreview = config?.is_dev_preview || false;

  // Poll session status for queue
  useEffect(() => {
    if (!config || (config.mode !== 'production' && !isSaaSPreview) || !auth?.authenticated) return;
    if (forceQueue) return; // Don't poll if we're forcing the UI

    let interval: number;

    const checkSession = async () => {
      try {
        const { data } = await apiClient.get('/system/session/status', {
          params: { session_id: sessionId }
        });
        setSessionStatus(data.status);
        setQueueInfo(data);
        
        if (data.status === 'granted') {
          // Start heartbeat
          apiClient.post('/system/session/heartbeat', null, {
            params: { session_id: sessionId }
          });
        }
      } catch (err) {
        setSessionStatus('error');
      }
    };

    checkSession();
    interval = window.setInterval(checkSession, 15000); // Check/Heartbeat every 15s

    return () => clearInterval(interval);
  }, [config, auth]);

  if (configLoading || authLoading) {
    return (
      <div className="auth-gate-loader">
        <div className="spinner"></div>
        <p>Initializing AetherGIS v2.0...</p>
        <style>{`
          .auth-gate-loader {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #050505;
            color: #646cff;
            font-family: 'Inter', sans-serif;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(100, 108, 255, 0.1);
            border-top: 3px solid #646cff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Development mode: Bypass everything (unless preview is enabled)
  if (config?.mode === 'development' && !isSaaSPreview) {
    return <>{children}</>;
  }

  // Production mode: Check auth
  if (!auth?.authenticated) {
    window.location.href = '/api/v1/auth/login';
    return null;
  }

  // Production mode: Check queue (granted vs waiting)
  if (sessionStatus === 'waiting' || forceQueue) {
    return (
      <div className="waiting-room">
        {isSaaSPreview && (
          <div className="dev-banner">
            SAAS PREVIEW MODE • 
            <button onClick={() => setForceQueue(false)} className="dev-link">Resume Real State</button> • 
            <button onClick={() => setSessionStatus('granted')} className="dev-link">Dev Bypass</button>
          </div>
        )}
        <div className="waiting-card">
          <h1>System Capacity Reached</h1>
          <p>AetherGIS is currently processing a high-priority analysis run. As a "King of the Hill" system, we allow one concurrent controller to protect GPU performance.</p>
          <div className="queue-status">
            <div className="status-item">
              <span className="lbl">Your Position</span>
              <span className="val">#{queueInfo?.position || '?'}</span>
            </div>
            <div className="status-item">
              <span className="lbl">Estimated Wait</span>
              <span className="val">{queueInfo?.estimated_wait_minutes || '5'}m</span>
            </div>
          </div>
          <p className="hint">This page will automatically refresh when hardware becomes available.</p>
        </div>
        <style>{`
          .waiting-room {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #050505;
            color: #fff;
            padding: 2rem;
            font-family: 'Inter', sans-serif;
          }
          .dev-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #646cff;
            color: #fff;
            font-size: 0.7rem;
            font-weight: 700;
            text-align: center;
            padding: 0.5rem;
            z-index: 100;
            letter-spacing: 0.1em;
          }
          .dev-link {
            background: transparent;
            border: none;
            color: #fff;
            text-decoration: underline;
            cursor: pointer;
            margin: 0 0.5rem;
            font-weight: 800;
          }
          .waiting-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 3rem;
            border-radius: 24px;
            max-width: 600px;
            text-align: center;
          }
          h1 { font-size: 2rem; margin-bottom: 1.5rem; color: #646cff; }
          p { color: #888; line-height: 1.6; margin-bottom: 2rem; }
          .queue-status {
            display: flex;
            justify-content: center;
            gap: 3rem;
            background: rgba(0,0,0,0.3);
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
          }
          .status-item { display: flex; flex-direction: column; gap: 0.5rem; }
          .lbl { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
          .val { font-size: 1.5rem; font-weight: 700; color: #fff; }
          .hint { font-size: 0.85rem; font-style: italic; opacity: 0.7; }
        `}</style>
      </div>
    );
  }

  // Granted or bypassing queue check
  return <>{children}</>;
};

export default AuthGate;
