/**
 * AetherGIS — Main App layout (QGIS Engineering Dashboard)
 * PRD-aligned: FILM primary model, real health status, server-down banner.
 */
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapViewer from './components/MapViewer';
import LayerControls from './components/LayerControls';
import AnalysisPanel from './components/AnalysisPanel';
import TimelineScrubber from './components/TimelineScrubber';
import ServerStatus from './components/ServerStatus';
import { useStore } from './store/useStore';
import { useHealth, useJobStatus, useJobResults } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000, retryDelay: (n) => Math.min(1000 * 2 ** n, 10_000) },
  },
});

// Job status polling
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

// Menubar with real-time health from API
function Menubar() {
  const { jobStatus, jobProgress } = useStore();
  const { data: health, isError: healthError } = useHealth();

  const filmLoaded = health?.film_model_loaded ?? health?.rife_model_loaded ?? false;
  const gpuOk = health?.gpu_available ?? false;
  const redisOk = health?.redis_connected ?? false;
  const apiOnline = !healthError && !!health;

  const statusLabel: Record<string, string> = {
    idle: '● Pipeline ready',
    queued: '● Queued…',
    running: `● Running ${jobProgress > 0 ? Math.round(jobProgress * 100) + '%' : '…'}`,
    completed: '● Pipeline complete',
    failed: '✕ Pipeline failed',
  };
  const statusCls: Record<string, string> = {
    idle: 'sb-ready', queued: 'sb-warn', running: 'sb-warn', completed: 'sb-ready', failed: '',
  };

  return (
    <div className="menubar">
      <div className="app-name">
        Aether<span className="blue">GIS</span>{' '}
        <span style={{ fontWeight: 400, color: 'var(--t3)', fontSize: 11 }}>1.0.0</span>
      </div>

      {['File', 'View', 'Layer', 'Pipeline', 'Analysis', 'Tools', 'Help'].map(m => (
        <div key={m} className="menu-item">{m}</div>
      ))}

      <div className="menubar-right">
        <div className="status-pill">
          <div className={`s-dot ${apiOnline ? (redisOk ? 'ok' : 'warn') : 'err'}`} />
          NASA GIBS {!apiOnline && <span style={{ color: 'var(--red)', fontWeight: 600 }}>(offline)</span>}
        </div>
        <div className="status-pill">
          <div className="s-dot warn" />
          BHUVAN P2
        </div>
        <div className="status-pill">
          <div className={`s-dot ${apiOnline && filmLoaded ? 'ok' : apiOnline ? 'warn' : 'err'}`} />
          FILM Engine {apiOnline ? (filmLoaded ? '' : <span style={{ color: 'var(--orange)' }}>(loading)</span>) : ''}
        </div>
        <div className="status-pill">
          <div className={`s-dot ${gpuOk ? 'ok' : 'idle'}`} />
          GPU {gpuOk ? '· RTX 4060' : '· CPU-only'}
        </div>
        {jobStatus === 'running' && (
          <div style={{ width: 80, height: 4, background: 'var(--b2)', flexShrink: 0 }}>
            <div style={{ height: '100%', background: 'var(--blue)', width: `${jobProgress * 100}%`, transition: 'width 0.4s' }} />
          </div>
        )}
        <div className={`status-pill ${statusCls[jobStatus] || ''}`}>
          {statusLabel[jobStatus]}
        </div>
      </div>
    </div>
  );
}

// Toolbar
function Toolbar() {
  const selectedLayer = useStore(s => s.selectedLayer);
  return (
    <div className="toolbar">
      <div className="tb-group">
        <button className="tb-btn" title="New Session">📄</button>
        <button className="tb-btn" title="Open">📂</button>
        <button className="tb-btn" title="Save">💾</button>
      </div>
      <div className="tb-group">
        <button className="tb-btn active" title="Draw BBOX (B)">⬚</button>
        <button className="tb-btn" title="Pan (P)">✥</button>
        <button className="tb-btn" title="Zoom In">⊕</button>
        <button className="tb-btn" title="Zoom Out">⊖</button>
        <button className="tb-btn" title="Zoom Full">⊡</button>
      </div>
      <div className="tb-group">
        <button className="tb-btn" title="Side-by-Side">⊟</button>
        <button className="tb-btn" title="Diff View">⊘</button>
      </div>
      <div className="tb-sep" />
      <div className="tb-label">SOURCE:</div>
      <select className="tb-source-select" defaultValue="NASA GIBS">
        <option>NASA GIBS</option>
        <option disabled>ISRO Bhuvan (Phase 2)</option>
      </select>
      <div className="tb-sep" />
      <div className="tb-info">CRS: <strong>EPSG:4326</strong></div>
      <div className="tb-info">Scale: <strong>1:4,500,000</strong></div>
      <div className="tb-info">
        Layer: <strong>{selectedLayer ? selectedLayer.split('_').slice(0, 2).join(' ') : 'No selection'}</strong>
      </div>
    </div>
  );
}

// Status bar
function StatusBar() {
  const { pipelineResult, jobStatus, bbox, apiError } = useStore();
  const { data: health } = useHealth();

  const statusCls = jobStatus === 'completed' ? 'sb-ready' : jobStatus === 'failed' ? '' : jobStatus !== 'idle' ? 'sb-warn' : 'sb-ready';
  const statusLabel = jobStatus === 'completed' ? '● Pipeline complete' : jobStatus === 'failed' ? '✕ Pipeline failed' : jobStatus !== 'idle' ? '● Running…' : '● Pipeline ready';

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
      {pipelineResult && (
        <div className="sb-seg">
          Frames: <strong>{pipelineResult.frames?.length}</strong>
          {' · '}PSNR: <strong>{pipelineResult.metrics?.avg_psnr?.toFixed(1) ?? '—'} dB</strong>
        </div>
      )}
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

// Main inner app
export default function AppInner() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <JobPoller />
      <Menubar />
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
          {/* Map */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--map-bg)', minHeight: 0 }}>
            <MapViewer />
          </div>
          {/* Timeline */}
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

