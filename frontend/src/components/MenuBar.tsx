/**
 * AetherGIS — MenuBar with functional dropdown menus.
 * CSS-only hover dropdowns (no extra dependencies).
 * Each menu item maps to a real store action or browser action.
 */
import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useHealth } from '../api/client';
import { triggerVideoExport } from '../api/client';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface MenuItem {
  label: string;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

/* ─── Single dropdown menu ───────────────────────────────────────────────── */
function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  return (
    <div
      ref={ref}
      className="menu-root"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={`menu-item${open ? ' active' : ''}`}>{label}</div>
      {open && (
        <div className="dropdown">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="dd-divider" />
            ) : (
              <div
                key={i}
                className={`dd-item${item.disabled ? ' disabled' : ''}`}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  if (item.href) window.open(item.href, '_blank');
                  else item.onClick?.();
                }}
              >
                <span className="dd-label">{item.label}</span>
                {item.shortcut && <span className="dd-shortcut">{item.shortcut}</span>}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Keyboard shortcuts modal ───────────────────────────────────────────── */
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const SHORTCUTS = [
    { key: 'Space', action: 'Play / Pause' },
    { key: '← →', action: 'Step frame backward / forward' },
    { key: 'Home / End', action: 'Jump to first / last frame' },
    { key: '1 2 3 4', action: 'Set playback speed 0.5× 1× 2× 4×' },
    { key: 'A', action: 'All frames mode' },
    { key: 'O', action: 'Original only mode' },
    { key: 'I', action: 'AI generated only mode' },
    { key: 'M', action: 'Toggle metadata overlay' },
    { key: 'Esc', action: 'Close modal / Stop playback' },
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Keyboard Shortcuts</div>
        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map(s => (
              <tr key={s.key}>
                <td><kbd className="kbd">{s.key}</kbd></td>
                <td className="kbd-action">{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── About modal ────────────────────────────────────────────────────────── */
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">About AetherGIS</div>
        <div className="modal-body">
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--cond)', letterSpacing: '0.04em', marginBottom: 8 }}>
            Aether<span style={{ color: 'var(--t1)' }}>GIS</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--t3)', marginLeft: 8 }}>v1.0.0</span>
          </div>
          <p>An AI-powered temporal super-resolution platform for satellite meteorological imagery. Bridges observational gaps in GEO/LEO satellite data using deep learning frame interpolation.</p>
          <p><strong>Interpolation Engine:</strong> Google FILM (Frame Interpolation for Large Motion)</p>
          <p><strong>Data Sources:</strong> NASA GIBS · ISRO MOSDAC (Phase 2) · EUMETSAT (Phase 3)</p>
          <p><strong>Supported Satellites:</strong> GOES-East/West, Himawari-9, MODIS Terra/Aqua, VIIRS S-NPP</p>
          <div className="modal-notice">
            AI-interpolated frames are synthetic approximations for qualitative temporal analysis only.
            Not for operational forecasting or scientific measurement.
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Main MenuBar ───────────────────────────────────────────────────────── */
export default function MenuBar() {
  const {
    jobStatus, jobProgress, jobId, pipelineResult,
    setShowMetadataOverlay, showMetadataOverlay,
    setShowLowConfidence, showLowConfidence, setIsPlaying, bbox,
    setActivePanel,
  } = useStore();
  const { data: health, isError: healthError } = useHealth();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [exportStatus, setExportStatus] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});

  const filmLoaded = health?.film_model_loaded ?? health?.rife_model_loaded ?? false;
  const gpuOk = health?.gpu_available ?? false;
  const apiOnline = !healthError && !!health;

  const handleExport = async (type: 'original' | 'interpolated') => {
    if (!jobId) return;
    setExportStatus(s => ({ ...s, [type]: 'loading' }));
    try {
      const res = await triggerVideoExport(jobId, type);
      if (res.status === 'ready' && res.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = `aethergis_${type}_${jobId.slice(0, 8)}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setExportStatus(s => ({ ...s, [type]: 'done' }));
    } catch {
      setExportStatus(s => ({ ...s, [type]: 'idle' }));
    }
  };

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

  const fileItems: MenuItem[] = [
    {
      label: 'New Session',
      shortcut: 'Ctrl+N',
      onClick: () => {
        // Open Session Manager with the new-session intent
        window.dispatchEvent(new CustomEvent('aethergis:openSessionManager', { detail: { action: 'new' } }));
      },
    },
    { label: 'divider', divider: true },
    {
      label: exportStatus.interpolated === 'loading' ? 'Generating…' : 'Export MP4 (Enhanced)',
      shortcut: 'Ctrl+E',
      disabled: !jobId,
      onClick: () => handleExport('interpolated'),
    },
    {
      label: exportStatus.original === 'loading' ? 'Generating…' : 'Export MP4 (Original)',
      disabled: !jobId,
      onClick: () => handleExport('original'),
    },
    {
      label: 'Export JSON Metadata',
      disabled: !jobId,
      onClick: () => {
        if (jobId) window.open(`/api/v1/pipeline/${jobId}/metadata`, '_blank');
      },
    },
    { label: 'divider', divider: true },
    {
      label: 'Close App',
      onClick: () => window.close(),
    },
  ];

  const viewItems: MenuItem[] = [
    {
      label: `${showMetadataOverlay ? '✓' : '  '} Metadata Overlay`,
      shortcut: 'M',
      onClick: () => setShowMetadataOverlay(!showMetadataOverlay),
    },
    {
      label: `${showLowConfidence ? '✓' : '  '} Show Low-Confidence Frames`,
      onClick: () => setShowLowConfidence(!showLowConfidence),
    },
    { label: 'divider', divider: true },
    {
      label: 'Zoom to AOI',
      disabled: !bbox,
      onClick: () => {
        // Dispatch custom event that MapViewer listens for
        window.dispatchEvent(new CustomEvent('aethergis:zoomToAoi'));
      },
    },
  ];

  const pipelineItems: MenuItem[] = [
    {
      label: 'Run Pipeline',
      shortcut: 'Ctrl+R',
      disabled: !bbox || jobStatus === 'running' || jobStatus === 'queued',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('aethergis:runPipeline'));
      },
    },
    {
      label: 'Cancel Pipeline',
      disabled: jobStatus !== 'running' && jobStatus !== 'queued',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('aethergis:cancelPipeline'));
      },
    },
    { label: 'divider', divider: true },
    {
      label: 'Pipeline Settings',
      onClick: () => setActivePanel('controls'),
    },
  ];

  const analysisItems: MenuItem[] = [
    {
      label: 'View Metrics',
      disabled: !pipelineResult,
      onClick: () => setActivePanel('analysis'),
    },
    {
      label: 'Export‥',
      disabled: !pipelineResult,
      onClick: () => setActivePanel('export'),
    },
    { label: 'divider', divider: true },
    {
      label: 'Pause Playback',
      disabled: !pipelineResult,
      onClick: () => setIsPlaying(false),
    },
  ];

  const toolsItems: MenuItem[] = [
    {
      label: 'Clear AOI',
      disabled: !bbox,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('aethergis:clearAoi'));
      },
    },
    { label: 'divider', divider: true },
    {
      label: 'Keyboard Shortcuts',
      shortcut: '?',
      onClick: () => setShowShortcuts(true),
    },
  ];

  const helpItems: MenuItem[] = [
    {
      label: 'About AetherGIS',
      onClick: () => setShowAbout(true),
    },
    {
      label: 'Documentation',
      href: 'https://github.com/tejasbhor/AetherGIS#readme',
    },
    {
      label: 'Report Issue',
      href: 'https://github.com/tejasbhor/AetherGIS/issues',
    },
    { label: 'divider', divider: true },
    {
      label: 'Keyboard Shortcuts',
      onClick: () => setShowShortcuts(true),
    },
  ];

  return (
    <>
      <div className="menubar">
        <div className="app-name">
          Aether<span className="blue">GIS</span>{' '}
          <span style={{ fontWeight: 400, color: 'var(--t3)', fontSize: 11 }}>1.0.0</span>
        </div>

        <Menu label="File" items={fileItems} />
        <Menu label="View" items={viewItems} />
        <Menu label="Layer" items={[
          { label: 'Layer Browser', onClick: () => setActivePanel('controls') },
          { label: 'divider', divider: true },
          { label: 'NASA GIBS ✓', disabled: true },
          { label: 'ISRO MOSDAC (Phase 2)', disabled: true },
          { label: 'EUMETSAT (Phase 3)', disabled: true },
        ]} />
        <Menu label="Pipeline" items={pipelineItems} />
        <Menu label="Analysis" items={analysisItems} />
        <Menu label="Tools" items={toolsItems} />
        <Menu label="Help" items={helpItems} />

        <div className="menubar-right">
          <div className="status-pill">
            <div className={`s-dot ${apiOnline ? (health?.redis_connected ? 'ok' : 'warn') : 'err'}`} />
            NASA GIBS {!apiOnline && <span style={{ color: 'var(--red)', fontWeight: 600 }}>(offline)</span>}
          </div>
          <div className="status-pill">
            <div className="s-dot warn" />
            MOSDAC P2
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

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
