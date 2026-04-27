/**
 * AetherGIS — Scenario Replay Engine Panel (Module 8).
 * Exposes POST /jobs/{id}/replay with configurable params.
 */
import { useState } from 'react';
import { useStore } from '@app/store/useStore';
import { submitReplay } from '@shared/api/client';

export default function ReplayPanel() {
  const { jobId, pipelineResult } = useStore();
  const [model, setModel] = useState<string>('film');
  const [nInterp, setNInterp] = useState<number>(4);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [newJobId, setNewJobId] = useState<string | null>(null);

  const jobCompleted = !!pipelineResult;

  const handleReplay = async () => {
    if (!jobId) return;
    setStatus('loading');
    try {
      const res = await submitReplay(jobId, model, nInterp, undefined);
      setNewJobId(res.new_job_id);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (!jobCompleted) return null;

  return (
    <>
      <div className="section-hdr">
        Scenario Replay
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--blue)' }}>Module 8</span>
      </div>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--b2)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', marginBottom: 6, lineHeight: 1.5 }}>
          Re-run this job with different parameters to compare outputs.
        </div>
        <div className="form-row">
          <span className="form-label">Model</span>
          <select className="inp" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="film">FILM</option>
            <option value="rife">RIFE</option>
            <option value="lk_fallback">Optical Flow</option>
          </select>
        </div>
        <div className="form-row">
          <span className="form-label">Frames/gap</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="range" className="range" min={1} max={8} value={nInterp} style={{ flex: 1 }}
              onChange={(e) => setNInterp(Number(e.target.value))} />
            <span className="slider-val">{nInterp}</span>
          </div>
        </div>

        {status === 'done' && newJobId && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', background: 'var(--teal-bg)', border: '1px solid var(--teal-lt)', padding: '4px 6px', borderRadius: 3, marginBottom: 6 }}>
            ✓ Replay queued · Job: {newJobId.slice(0, 12)}…
          </div>
        )}
        {status === 'error' && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-lt)', padding: '4px 6px', borderRadius: 3, marginBottom: 6 }}>
            ✕ Replay submission failed.
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%', fontSize: 11, opacity: status === 'loading' ? 0.65 : 1 }}
          onClick={handleReplay}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '⧗ Submitting…' : '⟳ Start Replay'}
        </button>
      </div>
    </>
  );
}
