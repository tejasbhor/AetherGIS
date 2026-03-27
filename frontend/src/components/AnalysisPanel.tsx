/**
 * AetherGIS — AnalysisPanel (right dock)
 * PRD-aligned: empty state, job failed state, real metric display,
 * confidence-based color coding, wired export URLs.
 */
import { useState, useEffect } from 'react';
import type { FrameMetadata } from '../store/useStore';
import { useStore } from '../store/useStore';
import { getVideoUrl, getMetadataUrl } from '../api/client';

function ConfTag({ cls, score }: { cls?: string; score?: number }) {
  if (!cls) return null;
  const c = cls.toLowerCase();
  return (
    <span className={`conf-tag ${c}`}>
      &#9632; {cls}{score !== undefined ? ` · ${score.toFixed(2)}` : ''}
    </span>
  );
}

// ─── Empty state: no pipeline run yet (collapsible, localStorage backed) ─────
function EmptyState() {
  // Expanded by default on first visit; user can collapse, preference is remembered
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('tgis_guide_open');
      return v === null ? true : v === 'true';
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('tgis_guide_open', String(open)); } catch { }
  }, [open]);

  const STEPS = [
    { n: '1', title: 'Select a layer', body: 'Choose a NASA GIBS satellite layer from the left panel. The map will instantly auto-pan to the WMO operational domain.' },
    { n: '2', title: 'Monitoring Domain', body: 'The bounding box is set automatically via presets (e.g. Bay of Bengal, Gulf of Mexico), but you can drag on the map to override it.' },
    { n: '3', title: 'Smart Time Range', body: 'Start and end times are automatically configured to fetch the latest available frames based on the satellite\'s latency.' },
    { n: '4', title: 'Choose AI model', body: 'FILM (Google Research) is the primary model — best for large motion and longer gaps.' },
    { n: '5', title: 'Run Pipeline', body: 'Click "Run Pipeline". Analysis results, metrics, and video exports will appear here when the job completes.' },
  ];

  return (
    <div style={{ padding: '8px 12px 12px', flex: 1, overflowY: 'auto' }}>
      {/* Collapsible header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: 'var(--cond)', fontSize: 11, fontWeight: 600, color: 'var(--t3)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: open ? '1px solid var(--b2)' : 'none',
          paddingBottom: open ? 6 : 0, marginBottom: open ? 10 : 0,
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>How to get started</span>
        <span style={{ fontSize: 9, color: 'var(--t4)', fontWeight: 400 }}>{open ? '▲ HIDE' : '▼ SHOW'}</span>
      </div>

      {/* Collapsible body */}
      {open && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, background: 'var(--blue)', color: '#fff',
                  fontFamily: 'var(--cond)', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{step.n}</div>
                <div>
                  <div style={{ fontFamily: 'var(--cond)', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)', lineHeight: 1.55 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--b2)', paddingTop: 8, marginTop: 10, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', lineHeight: 1.6 }}>
            ℹ Results include PSNR, SSIM, Temporal Consistency Score, confidence distribution, and per-frame metadata.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Error state: job failed ──────────────────────────────────
function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
      <div style={{
        background: 'var(--red-bg)', border: '1px solid var(--red-lt)',
        borderLeft: '3px solid var(--red)', padding: '8px 10px',
      }}>
        <div style={{ fontFamily: 'var(--cond)', fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>
          ✕ PIPELINE FAILED
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', lineHeight: 1.6 }}>
          {error}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', marginTop: 8 }}>
          Common causes: WMS service unavailable · OOM on GPU · Invalid BBox / time range · Network timeout
        </div>
      </div>
    </div>
  );
}

// ─── Running state ────────────────────────────────────────────
function RunningState({ progress }: { progress: number }) {
  return (
    <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--cond)', fontSize: 11, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="spinner" />
        Pipeline Running…
      </div>
      <div style={{ height: 4, background: 'var(--b2)' }}>
        <div style={{ height: '100%', background: 'var(--blue)', width: `${progress * 100}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>
        {Math.round(progress * 100)}% complete
      </div>
      <table className="prop-table" style={{ marginTop: 8 }}>
        <tbody>
          {[
            ['Stage', 'AI Inference / Confidence Scoring'],
            ['Frames', 'Calculating…'],
            ['PSNR', 'Pending'],
            ['SSIM', 'Pending'],
          ].map(([k, v]) => (
            <tr key={k}>
              <td className="prop-key">{k}</td>
              <td className="prop-val" style={{ color: 'var(--t4)' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Analysis Panel ──────────────────────────────────────
export default function AnalysisPanel() {
  const { pipelineResult, currentFrameIndex, setComparisonMode, comparisonMode, jobStatus, jobProgress, jobId, apiError } = useStore();
  const [activeTab, setActiveTab] = useState<'metrics' | 'export'>('metrics');

  const metrics = pipelineResult?.metrics;
  const frames = pipelineResult?.frames || [];
  const currentFrame: FrameMetadata | undefined = frames[currentFrameIndex];

  // ─ Running state
  if (jobStatus === 'queued' || jobStatus === 'running') {
    return <RunningState progress={jobProgress} />;
  }

  // ─ Failed state
  if (jobStatus === 'failed') {
    return <ErrorState error={apiError || 'Unknown pipeline error.'} />;
  }

  // ─ Empty state (idle, never run)
  if (!pipelineResult) {
    return <EmptyState />;
  }

  // ─ Results loaded
  const total = metrics?.total_frames || 0;
  const confData = metrics ? [
    { label: 'High', count: metrics.high_confidence_count, pct: total ? metrics.high_confidence_count / total * 100 : 0, color: 'var(--green)' },
    { label: 'Medium', count: metrics.medium_confidence_count, pct: total ? metrics.medium_confidence_count / total * 100 : 0, color: 'var(--orange)' },
    { label: 'Low', count: metrics.low_confidence_count, pct: total ? metrics.low_confidence_count / total * 100 : 0, color: 'var(--red)' },
    { label: 'Observed', count: metrics.observed_frames, pct: total ? metrics.observed_frames / total * 100 : 0, color: 'var(--t3)' },
  ] : [];

  const psnrValues = frames.filter(f => f.psnr !== undefined).map(f => f.psnr as number);
  const minPsnr = psnrValues.length ? Math.min(...psnrValues) : 20;
  const maxPsnr = psnrValues.length ? Math.max(...psnrValues) : 36;

  const sparkPath = (() => {
    if (psnrValues.length < 2) return '';
    const w = 270; const h = 48;
    return psnrValues.map((v, i) => {
      const x = (i / (psnrValues.length - 1)) * w;
      const y = h - ((v - minPsnr) / Math.max(maxPsnr - minPsnr, 0.1)) * (h - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  })();

  // PSNR quality assessment per PRD §14.5 (pass > 28 dB for High Confidence)
  const psnrClass = (metrics?.avg_psnr ?? 0) >= 28 ? 'green' : (metrics?.avg_psnr ?? 0) >= 22 ? 'orange' : 'red';
  const ssimClass = (metrics?.avg_ssim ?? 0) >= 0.85 ? 'green' : (metrics?.avg_ssim ?? 0) >= 0.7 ? 'orange' : 'red';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 4-column metric header */}
      <div className="metric-row">
        <div className="metric-cell">
          <div className="mc-v blue">{total || '—'}</div>
          <div className="mc-k">Total Frames</div>
        </div>
        <div className="metric-cell">
          <div className={`mc-v ${psnrClass}`}>{metrics?.avg_psnr?.toFixed(1) ?? '—'}</div>
          <div className="mc-k">PSNR dB</div>
        </div>
        <div className="metric-cell">
          <div className={`mc-v ${ssimClass}`}>{metrics?.avg_ssim?.toFixed(3) ?? '—'}</div>
          <div className="mc-k">SSIM</div>
        </div>
        <div className="metric-cell">
          <div className={`mc-v ${(metrics?.tcs ?? 0) > 0.75 ? 'green' : 'orange'}`}>{metrics?.tcs?.toFixed(2) ?? '—'}</div>
          <div className="mc-k">TCS</div>
        </div>
      </div>

      {/* Tab row */}
      <div className="tab-row">
        <button className={`tab-btn${activeTab === 'metrics' ? ' active' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</button>
        <button className={`tab-btn${activeTab === 'export' ? ' active' : ''}`} onClick={() => setActiveTab('export')}>Export</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {activeTab === 'metrics' && (
          <>
            {/* Confidence Distribution */}
            <div className="section-hdr" style={{ borderTop: 'none' }}>
              Confidence Distribution
              <span style={{ fontSize: 8 }}>▼</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              <table className="conf-table">
                <tbody>
                  {confData.map(d => (
                    <tr key={d.label}>
                      <td className="cf-label" style={{ color: d.color }}>{d.label}</td>
                      <td><div className="cf-track"><div className="cf-fill" style={{ width: `${d.pct.toFixed(1)}%`, background: d.color }} /></div></td>
                      <td className="cf-num" style={{ color: d.color }}>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PRD §16 — KPI summary */}
            {metrics && (
              <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--b2)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)' }}>
                  FSI: <span style={{ color: 'var(--t2)' }}>{metrics.fsi?.toFixed(2) ?? '—'}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)' }}>
                  High conf: <span style={{ color: 'var(--green)' }}>
                    {total ? Math.round(metrics.high_confidence_count / total * 100) : '—'}%
                  </span>
                  {total && metrics.high_confidence_count / total < 0.6 &&
                    <span style={{ color: 'var(--orange)' }}> ⚠ &lt;60% target</span>}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)' }}>
                  Obs/AI: <span style={{ color: 'var(--t2)' }}>{metrics.observed_frames}/{metrics.interpolated_frames}</span>
                </div>
              </div>
            )}

            {/* PSNR chart */}
            <div className="section-hdr">
              PSNR per Frame
              <span style={{ fontSize: 8 }}>▼</span>
            </div>
            <div className="chart-area">
              {psnrValues.length < 2 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', fontStyle: 'italic' }}>
                  Insufficient PSNR data
                </div>
              ) : (
                <svg viewBox="0 0 270 48" fill="none" preserveAspectRatio="none">
                  {[12, 24, 36].map(y => <line key={y} x1="0" y1={y} x2="270" y2={y} stroke="var(--b3)" strokeWidth="0.75" />)}
                  <line x1="0" y1="24" x2="270" y2="24" stroke="var(--orange)" strokeWidth="0.75" strokeDasharray="4,3" opacity="0.7" />
                  {sparkPath && (
                    <>
                      <path d={sparkPath + ' L270,48 L0,48Z'} fill="rgba(26,95,168,0.1)" />
                      <path d={sparkPath} stroke="var(--blue)" strokeWidth="1.25" strokeLinejoin="round" />
                    </>
                  )}
                  <text x="2" y="11" fill="var(--t3)" fontFamily="JetBrains Mono" fontSize="6">{maxPsnr.toFixed(0)} dB</text>
                  <text x="2" y="23" fill="var(--orange)" fontFamily="JetBrains Mono" fontSize="6">28 dB</text>
                  <text x="2" y="35" fill="var(--t3)" fontFamily="JetBrains Mono" fontSize="6">{minPsnr.toFixed(0)} dB</text>
                </svg>
              )}
            </div>

            {/* Active Frame Properties */}
            <div className="section-hdr">
              Active Frame Properties
              <span style={{ fontSize: 8 }}>▼</span>
            </div>
            {!currentFrame ? (
              <div style={{ padding: '6px 8px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', fontStyle: 'italic' }}>
                Select a frame on the timeline
              </div>
            ) : (
              <table className="prop-table">
                <tbody>
                  <tr><td className="prop-key">Frame Index</td>     <td className="prop-val blue">#{currentFrameIndex + 1} / {frames.length}</td></tr>
                  <tr><td className="prop-key">Timestamp</td>       <td className="prop-val blue" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{new Date(currentFrame.timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC</td></tr>
                  <tr><td className="prop-key">Frame Type</td>      <td className={`prop-val ${currentFrame.is_interpolated ? 'orange' : 'green'}`}>{currentFrame.is_interpolated ? 'AI-Generated' : 'Observed'}</td></tr>
                  <tr><td className="prop-key">Model</td>           <td className="prop-val">{currentFrame.model_used ?? '—'}</td></tr>
                  <tr><td className="prop-key">Confidence</td>      <td className="prop-val"><ConfTag cls={currentFrame.confidence_class} score={currentFrame.confidence_score} /></td></tr>
                  <tr><td className="prop-key">Flow Consist.</td>   <td className={`prop-val ${(currentFrame.flow_consistency ?? 0) < 0.15 ? 'green' : 'orange'}`}>{currentFrame.flow_consistency?.toFixed(3) ?? '—'}</td></tr>
                  <tr><td className="prop-key">MAD</td>             <td className={`prop-val ${(currentFrame.mad_score ?? 0) < 0.15 ? 'green' : (currentFrame.mad_score ?? 0) < 0.30 ? 'orange' : 'red'}`}>{currentFrame.mad_score?.toFixed(3) ?? '—'}</td></tr>
                  <tr><td className="prop-key">Gap Origin</td>      <td className="prop-val">{currentFrame.gap_minutes != null ? `+${currentFrame.gap_minutes.toFixed(0)} min ${currentFrame.gap_category ? `(${currentFrame.gap_category})` : ''}` : '—'}</td></tr>
                  <tr><td className="prop-key">PSNR</td>            <td className={`prop-val ${(currentFrame.psnr ?? 0) >= 28 ? 'green' : 'orange'}`}>{currentFrame.psnr != null ? `${currentFrame.psnr.toFixed(1)} dB` : '—'}</td></tr>
                  <tr><td className="prop-key">SSIM</td>            <td className={`prop-val ${(currentFrame.ssim ?? 0) >= 0.85 ? 'green' : 'orange'}`}>{currentFrame.ssim?.toFixed(3) ?? '—'}</td></tr>
                </tbody>
              </table>
            )}

            {/* Comparison View */}
            <div className="section-hdr">
              Comparison View
              <span style={{ fontSize: 8 }}>▼</span>
            </div>
            <div>
              <div className="tab-row">
                {(['side-by-side', 'overlay'] as const).map(m => (
                  <button key={m} className={`tab-btn${comparisonMode === m ? ' active' : ''}`} onClick={() => setComparisonMode(m)}>
                    {m === 'side-by-side' ? 'Side-by-Side' : 'Overlay'}
                  </button>
                ))}
              </div>
              <div style={{ padding: '5px 8px', fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
                Original (left) vs. AI-enhanced (right). Playback synchronized.
              </div>
            </div>
          </>
        )}

        {activeTab === 'export' && (
          <>
            <div className="section-hdr" style={{ borderTop: 'none' }}>
              Export Results
              <span style={{ fontSize: 8 }}>▼</span>
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', marginBottom: 8, lineHeight: 1.6 }}>
                Job ID: <span style={{ color: 'var(--t2)' }}>{jobId ?? '—'}</span>
              </div>
              <div className="export-grid">
                <a
                  className="exp-btn"
                  href={jobId ? getVideoUrl(jobId, 'interpolated') : '#'}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', pointerEvents: jobId ? 'auto' : 'none', opacity: jobId ? 1 : 0.4 }}
                >↓ MP4 (Enhanced)</a>
                <a
                  className="exp-btn"
                  href={jobId ? getVideoUrl(jobId, 'original') : '#'}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', pointerEvents: jobId ? 'auto' : 'none', opacity: jobId ? 1 : 0.4 }}
                >↓ MP4 (Original)</a>
                <a
                  className="exp-btn"
                  href={jobId ? getMetadataUrl(jobId) : '#'}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', pointerEvents: jobId ? 'auto' : 'none', opacity: jobId ? 1 : 0.4 }}
                >↓ JSON Metadata</a>
                <div className="exp-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }}>↓ ZIP Frames</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', marginTop: 8, lineHeight: 1.6 }}>
                ℹ Exported metadata includes per-frame confidence scores, PSNR/SSIM, model used, and gap analysis (PRD §6.5).
              </div>
            </div>
          </>
        )}
      </div>

      {/* PRD §13.1 — Scientific Disclaimer (always visible) */}
      <div className="warn-strip">
        <div className="ws-title">⚠ Scientific Disclaimer (PRD §13.1)</div>
        <div className="ws-body">
          All interpolated frames are visual approximations. NOT suitable for scientific measurement, quantitative analysis, or operational forecasting. Never replace observed satellite data.
        </div>
      </div>
    </div>
  );
}
