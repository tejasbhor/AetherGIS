/**
 * TemporalGIS — TimelineScrubber (QGIS-style dock)
 * PRD-aligned: rejected frame ticks, low-confidence filtering (default off),
 * gap indicators, empty state, stats with PRD KPIs.
 */
import { useRef, useEffect } from 'react';
import type { FrameMetadata } from '../store/useStore';
import { useStore } from '../store/useStore';

/** PRD §11.4 — frame tick type based on confidence class and rejection status */
function getTickClass(frame: FrameMetadata): 'real' | 'ai-h' | 'ai-m' | 'ai-l' | 'rejected' {
  if (!frame.is_interpolated) return 'real';
  const cls = frame.confidence_class;
  if (!cls) return 'ai-h';
  if (cls === 'REJECTED') return 'rejected';
  if (cls === 'HIGH')     return 'ai-h';
  if (cls === 'MEDIUM')   return 'ai-m';
  if (cls === 'LOW')      return 'ai-l';
  return 'ai-h';
}

const TICK_TITLE: Record<string, string> = {
  real:     'Observed (real satellite data)',
  'ai-h':   'AI-Generated · High Confidence',
  'ai-m':   'AI-Generated · Medium Confidence',
  'ai-l':   'AI-Generated · Low Confidence',
  rejected: 'Rejected — Flow inconsistency too high (no frame generated)',
};

function fmt(ts: string) {
  return new Date(ts).toISOString().slice(11, 16);
}

// ─── Empty state ─────────────────────────────────────────────
function EmptyTrack() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--mono)',
      fontSize: 9,
      color: 'var(--t4)',
      fontStyle: 'italic',
      letterSpacing: '0.03em',
      gap: 8,
    }}>
      <span>No frames loaded</span>
      <span style={{ color: 'var(--b1)' }}>|</span>
      <span>Select AOI → Set time range → Run Pipeline</span>
    </div>
  );
}

export default function TimelineScrubber() {
  const {
    pipelineResult, currentFrameIndex, setCurrentFrameIndex,
    isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed,
    showLowConfidence, setShowLowConfidence,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(currentFrameIndex);
  indexRef.current = currentFrameIndex;

  // PRD §6.6.3: showLowConfidence toggle gates low-conf frames from default playback
  const allFrames = pipelineResult?.frames || [];
  const frames = allFrames.filter(f => {
    if (!f.is_interpolated) return true;
    if (f.confidence_class === 'REJECTED') return false; // rejected never shown
    if (!showLowConfidence && f.confidence_class === 'LOW') return false;
    return true;
  });

  const totalFrames = frames.length;
  const currentMeta = frames[currentFrameIndex];
  const metrics = pipelineResult?.metrics;

  // Playback interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || totalFrames === 0) return;
    const delay = Math.round(1000 / (10 * playbackSpeed));
    intervalRef.current = setInterval(() => {
      const next = indexRef.current + 1;
      if (next >= totalFrames) { setIsPlaying(false); return; }
      setCurrentFrameIndex(next);
    }, delay);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, playbackSpeed, totalFrames]);

  const handlePlayPause = () => {
    if (currentFrameIndex >= totalFrames - 1) setCurrentFrameIndex(0);
    setIsPlaying(!isPlaying);
  };

  // Time ruler (5 labels, evenly spaced)
  let rulerLabels: string[] = [];
  if (frames.length >= 2) {
    const t0 = new Date(frames[0].timestamp).getTime();
    const t1 = new Date(frames[frames.length - 1].timestamp).getTime();
    rulerLabels = [0, 0.25, 0.5, 0.75, 1].map(p => {
      return new Date(t0 + p * (t1 - t0)).toISOString().slice(11, 16);
    });
  }

  // Per-frame frame counts
  const rejectedCount = allFrames.filter(f => f.confidence_class === 'REJECTED').length;

  return (
    <div className="timeline-dock">
      {/* Transport header */}
      <div className="tl-header">
        <button className="pb-btn" title="First frame" disabled={!totalFrames}
          onClick={() => { setIsPlaying(false); setCurrentFrameIndex(0); }}>⏮</button>
        <button className="pb-btn" title="Step back" disabled={!totalFrames || currentFrameIndex === 0}
          onClick={() => { setIsPlaying(false); setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1)); }}>◀</button>
        <button className="pb-btn pb-play" disabled={!totalFrames} onClick={handlePlayPause} title="Play/Pause">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="pb-btn" title="Step forward" disabled={!totalFrames || currentFrameIndex >= totalFrames - 1}
          onClick={() => { setIsPlaying(false); setCurrentFrameIndex(Math.min(totalFrames - 1, currentFrameIndex + 1)); }}>▶</button>
        <button className="pb-btn" title="Last frame" disabled={!totalFrames}
          onClick={() => { setIsPlaying(false); setCurrentFrameIndex(totalFrames - 1); }}>⏭</button>

        <select className="speed-select" value={playbackSpeed}
          onChange={e => setPlaybackSpeed(Number(e.target.value) as any)}>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>

        {/* Current frame timestamp */}
        <div className="tl-time-display">
          {currentMeta ? (
            <>
              <span style={{ color: 'var(--t3)', fontSize: 9 }}>
                {new Date(currentMeta.timestamp).toISOString().slice(0, 10)}
              </span>
              {' '}
              <strong>{fmt(currentMeta.timestamp)}</strong>
              <span style={{ color: 'var(--t3)', fontSize: 9 }}> UTC</span>
              {'  ·  '}
              <span style={{ color: 'var(--t3)', fontSize: 9 }}>
                {currentFrameIndex + 1}/{totalFrames}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--t4)', fontSize: 10 }}>No frames loaded</span>
          )}
        </div>

        {/* Low-Confidence toggle (PRD §6.6.3) */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)', cursor: 'pointer', marginLeft: 4 }}>
          <input
            type="checkbox"
            checked={showLowConfidence}
            onChange={() => setShowLowConfidence(!showLowConfidence)}
            style={{ width: 11, height: 11, accentColor: 'var(--red)' }}
          />
          Low Conf
        </label>

        {/* Stats columns */}
        {metrics && (
          <div className="tl-stats-bar">
            <div className="tl-stat">
              <div className="tl-stat-v blue">
                {metrics.interpolated_frames > 0 && metrics.observed_frames > 0
                  ? `${Math.round(metrics.total_frames / metrics.observed_frames)}×`
                  : '—'}
              </div>
              <div className="tl-stat-k">Temp Res</div>
            </div>
            <div className="tl-stat">
              <div className={`tl-stat-v ${(metrics.avg_psnr ?? 0) >= 28 ? 'green' : 'orange'}`}>
                {metrics.avg_psnr?.toFixed(1) ?? '—'}
              </div>
              <div className="tl-stat-k">PSNR dB</div>
            </div>
            <div className="tl-stat">
              <div className={`tl-stat-v ${(metrics.avg_ssim ?? 0) >= 0.85 ? 'green' : 'orange'}`}>
                {metrics.avg_ssim?.toFixed(2) ?? '—'}
              </div>
              <div className="tl-stat-k">SSIM</div>
            </div>
            <div className="tl-stat">
              <div className={`tl-stat-v ${(metrics.tcs ?? 0) >= 0.75 ? 'green' : 'orange'}`}>
                {metrics.tcs?.toFixed(2) ?? '—'}
              </div>
              <div className="tl-stat-k">TCS</div>
            </div>
            {rejectedCount > 0 && (
              <div className="tl-stat" title="Frames rejected by optical flow validation (PRD §11.3)">
                <div className="tl-stat-v red">{rejectedCount}</div>
                <div className="tl-stat-k">Rejected</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Track body */}
      <div className="tl-body">
        {/* Time ruler */}
        {rulerLabels.length > 0 && (
          <div className="tl-ruler">
            {rulerLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        )}

        {/* Frame track */}
        <div className="tl-track">
          {frames.length === 0 ? (
            <EmptyTrack />
          ) : frames.map((frame, idx) => {
            const type = getTickClass(frame);
            const isSelected = idx === currentFrameIndex;
            return (
              <div
                key={`${frame.frame_index}-${idx}`}
                className={`f-tick ${type}${isSelected ? ' sel' : ''}${type === 'rejected' ? ' f-tick-rejected' : ''}`}
                title={`${TICK_TITLE[type]} · ${fmt(frame.timestamp)} UTC · Frame ${idx + 1}`}
                onClick={() => { setIsPlaying(false); setCurrentFrameIndex(idx); }}
              >
                {type === 'real'     && <div className="f-tick-lbl">R</div>}
                {type === 'ai-m'    && <div className="f-tick-lbl">~</div>}
                {type === 'ai-l'    && <div className="f-tick-lbl">!</div>}
                {type === 'rejected' && <div className="f-tick-lbl" style={{ color: 'var(--t2)' }}>✕</div>}
              </div>
            );
          })}
        </div>

        {/* Footer: legend + KPI summary */}
        <div className="tl-footer">
          <div className="tl-legend">
            <div className="leg">
              <div className="leg-sw" style={{ background: 'rgba(32,122,48,0.5)', borderColor: 'rgba(32,122,48,0.8)' }} />
              Observed
            </div>
            <div className="leg">
              <div className="leg-sw" style={{ background: 'rgba(26,95,168,0.3)', borderColor: 'rgba(26,95,168,0.5)' }} />
              AI · High
            </div>
            <div className="leg">
              <div className="leg-sw" style={{ background: 'rgba(192,96,16,0.3)', borderColor: 'rgba(192,96,16,0.5)' }} />
              AI · Med
            </div>
            <div className="leg">
              <div className="leg-sw" style={{ background: 'rgba(184,32,32,0.15)', borderColor: 'rgba(184,32,32,0.35)' }} />
              AI · Low
            </div>
            <div className="leg">
              <div className="leg-sw" style={{ background: 'repeating-linear-gradient(45deg,var(--b3),var(--b3) 2px,var(--b2) 2px,var(--b2) 4px)', borderColor: 'var(--b1)' }} />
              Rejected
            </div>
          </div>
          {metrics && (
            <div className="tl-scores">
              TCS <strong>{metrics.tcs?.toFixed(2) ?? '—'}</strong>
              {' '}·{' '}
              FSI <strong>{metrics.fsi?.toFixed(2) ?? '—'}</strong>
              {' '}·{' '}
              {metrics.observed_frames} obs / {metrics.interpolated_frames} AI
              {rejectedCount > 0 && <span style={{ color: 'var(--red)' }}> / {rejectedCount} rejected</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
