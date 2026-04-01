/**
 * AetherGIS — Main App layout (QGIS Engineering Dashboard)
 * Production-ready: functional menu bar, session manager, keyboard shortcuts,
 * drift-resistant playback engine, custom-event cross-component wiring.
 */
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapViewer from './components/MapViewer';
import LayerControls from './components/LayerControls';
import AnalysisPanel from './components/AnalysisPanel';
import TimelineScrubber from './components/TimelineScrubber';
import ServerStatus from './components/ServerStatus';
import MenuBar from './components/MenuBar';
import SessionManager from './components/SessionManager';
import { useStore } from './store/useStore';
import { useHealth, useJobStatus, useJobResults } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000, retryDelay: (n) => Math.min(1000 * 2 ** n, 10_000) },
  },
});

// ─── Job status polling ───────────────────────────────────────────────────────
function JobPoller() {
  const { jobId, jobStatus, setJobStatus, setPipelineResult, setJobProgress, setJobMessage, setApiError } = useStore();
  const isActive = jobStatus === 'queued' || jobStatus === 'running';
  const { data: statusData, error: statusError } = useJobStatus(jobId, isActive);
  const { data: resultsData, error: resultsError } = useJobResults(jobId, statusData?.status === 'COMPLETED');

  useEffect(() => {
    if (!statusData) return;
    if (statusData.status === 'COMPLETED') setJobStatus('completed');
    else if (statusData.status === 'FAILED') { setJobStatus('failed'); setApiError(statusData.error || 'Pipeline job failed.'); }
    else if (statusData.status === 'RUNNING') setJobStatus('running');
    if (statusData.progress !== undefined) setJobProgress(statusData.progress);
    if (statusData.message !== undefined) setJobMessage(statusData.message ?? null);
  }, [statusData]);

  useEffect(() => {
    if (statusError) setApiError('Lost connection to job status endpoint.');
    if (resultsError) setApiError('Failed to retrieve pipeline results.');
  }, [statusError, resultsError]);

  useEffect(() => {
    if (resultsData) { setPipelineResult(resultsData); setJobMessage('Pipeline complete'); setApiError(null); }
  }, [resultsData]);

  return null;
}

// ─── Drift-resistant PlaybackEngine ──────────────────────────────────────────
/**
 * The ONLY setInterval in the app for playback.
 * Uses performance.now() to accumulate elapsed time, so slow frames don't
 * cause double-advances, and fast frames stay accurate at any speed.
 */
function PlaybackEngine() {
  const isPlaying   = useStore((s) => s.isPlaying);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const hasFrames   = useStore((s) => (s.pipelineResult?.frames.length ?? 0) > 0);

  useEffect(() => {
    if (!isPlaying || !hasFrames) return;

    const msPerFrame = 1000 / (10 * playbackSpeed);   // 10fps base
    let lastTick = performance.now();

    const id = setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTick;
      // Advance one frame per msPerFrame of elapsed time (handles tab throttling)
      if (elapsed >= msPerFrame * 0.85) {
        useStore.getState().playbackTick();
        lastTick = now;
      }
    }, Math.max(16, msPerFrame * 0.5));   // poll at 2× target rate, min 16ms (60fps)

    return () => clearInterval(id);
  }, [isPlaying, playbackSpeed, hasFrames]);

  return null;
}

// ─── Global keyboard shortcuts ────────────────────────────────────────────────
function KeyboardHandler() {
  const store = useStore;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip if input/textarea focused
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const s = store.getState();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          s.setIsPlaying(!s.isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          s.setIsPlaying(false);
          { const p = s.getNextFrameIndex(s.currentFrameIndex, -1); if (p !== null) s.setCurrentFrameIndex(p); }
          break;
        case 'ArrowRight':
          e.preventDefault();
          s.setIsPlaying(false);
          { const n = s.getNextFrameIndex(s.currentFrameIndex, 1); if (n !== null) s.setCurrentFrameIndex(n); }
          break;
        case 'Home':
          e.preventDefault();
          s.setIsPlaying(false);
          s.seekToStart();
          break;
        case 'End':
          e.preventDefault();
          s.setIsPlaying(false);
          s.seekToEnd();
          break;
        case '1': s.setPlaybackSpeed(0.5); break;
        case '2': s.setPlaybackSpeed(1); break;
        case '3': s.setPlaybackSpeed(2); break;
        case '4': s.setPlaybackSpeed(4); break;
        case 'a': case 'A': s.setPlaybackMode('all'); break;
        case 'o': case 'O': s.setPlaybackMode('original'); break;
        case 'i': case 'I': s.setPlaybackMode('interpolated'); break;
        case 'm': case 'M': s.setShowMetadataOverlay(!s.showMetadataOverlay); break;
        case 'Escape': s.setIsPlaying(false); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}

// ─── Toolbar (upgraded with Session Manager) ──────────────────────────────────
function Toolbar() {
  const { selectedLayer, jobHistory, bbox, setBbox } = useStore();
  const [showSessions, setShowSessions] = useState(false);

  // Custom events from MenuBar for cross-component wiring
  useEffect(() => {
    const clearAoi = () => setBbox(null);
    window.addEventListener('aethergis:clearAoi', clearAoi);
    return () => window.removeEventListener('aethergis:clearAoi', clearAoi);
  }, [setBbox]);

  // File → New Session from MenuBar opens the session manager panel
  useEffect(() => {
    const openSM = () => setShowSessions(true);
    window.addEventListener('aethergis:openSessionManager', openSM);
    return () => window.removeEventListener('aethergis:openSessionManager', openSM);
  }, []);

  const pendingCount = jobHistory.filter(j => j.frames.length > 0).length;

  return (
    <>
      <div className="toolbar">
        <div className="tb-group">
          {/* Session Manager trigger */}
          <button
            className="tb-btn tb-session-btn"
            title="Session Manager"
            onClick={() => setShowSessions(true)}
          >
            <span className="tb-btn-icon">⊞</span>
            <span className="tb-btn-text">Sessions</span>
            {pendingCount > 0 && (
              <span className="tb-badge">{pendingCount}</span>
            )}
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button className="tb-btn active" title="Draw AOI bounding box (B)">⬚</button>
          <button className="tb-btn" title="Pan (P)">✥</button>
          <button
            className="tb-btn"
            title="Zoom to AOI"
            disabled={!bbox}
            onClick={() => window.dispatchEvent(new CustomEvent('aethergis:zoomToAoi'))}
          >⊙</button>
          <button
            className="tb-btn"
            title="Clear AOI"
            disabled={!bbox}
            onClick={() => setBbox(null)}
          >⊗</button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <div className="tb-label">SOURCE:</div>
          <div className="tb-source-badge">
            <span className="tb-src-dot ok" />
            NASA GIBS
          </div>
          <div className="tb-source-badge" style={{ opacity: 0.45 }} title="Phase 2 — Coming soon">
            <span className="tb-src-dot warn" />
            MOSDAC P2
          </div>
          <div className="tb-source-badge" style={{ opacity: 0.3 }} title="Phase 3 — Planned">
            <span className="tb-src-dot idle" />
            EUMETSAT P3
          </div>
        </div>

        <div className="tb-sep" />

        <div className="tb-info">CRS: <strong>EPSG:4326</strong></div>
        {bbox && (
          <div className="tb-info" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>
            AOI: <strong>{bbox[0].toFixed(1)}°,{bbox[1].toFixed(1)}° – {bbox[2].toFixed(1)}°,{bbox[3].toFixed(1)}°</strong>
          </div>
        )}
        <div className="tb-info">
          Layer: <strong>{selectedLayer ? selectedLayer.split('_').slice(0, 2).join(' ') : 'No selection'}</strong>
        </div>
      </div>

      {showSessions && <SessionManager onClose={() => setShowSessions(false)} />}
    </>
  );
}

// ─── Status bar ────────────────────────────────────────────────────────────────
function StatusBar() {
  const { pipelineResult, jobStatus, bbox, apiError } = useStore();
  const { data: health } = useHealth();

  const statusCls = jobStatus === 'completed' ? 'sb-ready' : jobStatus === 'failed' ? '' : jobStatus !== 'idle' ? 'sb-warn' : 'sb-ready';
  const statusLabel =
    jobStatus === 'completed' ? '● Pipeline complete' :
    jobStatus === 'failed'    ? '✕ Pipeline failed' :
    jobStatus !== 'idle'      ? '● Running…' :
                                '● Ready';

  return (
    <div className="statusbar">
      <div className="sb-seg">AetherGIS 1.0.0</div>
      <div className="sb-seg">EPSG: <strong>4326</strong></div>
      {bbox ? (
        <div className="sb-seg" style={{ fontFamily: 'var(--mono)' }}>
          AOI: <strong>{bbox[0].toFixed(2)}°E – {bbox[2].toFixed(2)}°E · {bbox[1].toFixed(2)}°N – {bbox[3].toFixed(2)}°N</strong>
        </div>
      ) : (
        <div className="sb-seg" style={{ color: 'var(--t4)', fontStyle: 'italic' }}>No AOI selected</div>
      )}
      {pipelineResult?.frames.length ? (
        <div className="sb-seg">
          Frames: <strong>{pipelineResult.frames.length}</strong>
          {' · '}PSNR: <strong>{pipelineResult.metrics?.avg_psnr?.toFixed(1) ?? '—'} dB</strong>
          {' · '}SSIM: <strong>{pipelineResult.metrics?.avg_ssim?.toFixed(3) ?? '—'}</strong>
        </div>
      ) : null}
      {apiError && (
        <div className="sb-seg" style={{ color: 'var(--red)' }}>
          ⚠ {apiError.length > 60 ? apiError.slice(0, 60) + '…' : apiError}
        </div>
      )}
      <div className={`sb-seg ${statusCls}`}>{statusLabel}</div>
      <div className="sb-seg right">
        GPU: <strong>{health?.gpu_available ? 'RTX 4060' : 'CPU-only'}</strong>
        {health?.gpu_available ? ' · VRAM: 8 GB' : ''}
      </div>
    </div>
  );
}

// ─── Main inner app ───────────────────────────────────────────────────────────
function AppInner() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <JobPoller />
      <PlaybackEngine />
      <KeyboardHandler />
      <MenuBar />
      <Toolbar />
      {/* Server-down / partial-degradation banner */}
      <ServerStatus />

      {/* 3-column workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '262px 1fr 288px', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT DOCK */}
        <div className="dock dock-left">
          <div className="dock-title">
            <span className="dock-title-text">Layers / Parameters</span>
            <div className="dock-title-actions">
              <div className="dock-mini-btn" title="Add layer">+</div>
              <div className="dock-mini-btn" title="Remove">−</div>
            </div>
          </div>
          <div className="dock-scroll">
            <LayerControls />
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--map-bg)', minHeight: 0 }}>
            <MapViewer />
          </div>
          <TimelineScrubber />
        </div>

        {/* RIGHT DOCK */}
        <div className="dock dock-right" style={{ minHeight: 0 }}>
          <div className="dock-title">
            <span className="dock-title-text">Analysis</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <AnalysisPanel />
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}

// Root with providers
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
