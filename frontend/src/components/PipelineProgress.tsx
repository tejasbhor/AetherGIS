/**
 * AetherGIS — PipelineProgress overlay.
 * Shows on the map during active pipeline execution.
 * Per PRD: pipeline stages are WMS Fetch → Preprocess → Segment → AI Inference → Confidence → Video
 */
import { useStore } from '../store/useStore';

const STAGES = [
  'WMS Fetch',
  'Preprocess',
  'Segment',
  'AI Inference',
  'Confidence Score',
  'Video Generation',
];

export default function PipelineProgress() {
  const { jobStatus, jobProgress, jobMessage } = useStore();

  const isActive = jobStatus === 'queued' || jobStatus === 'running';
  if (!isActive) return null;

  const pct = Math.round(jobProgress * 100);
  // Determine active stage from progress
  const stageIdx = Math.min(Math.floor(jobProgress * STAGES.length), STAGES.length - 1);
  const stageName = jobMessage?.trim() || (jobStatus === 'queued' ? 'QUEUED ? WAITING FOR WORKER' : STAGES[stageIdx].toUpperCase());

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      background: 'rgba(16,24,38,0.95)',
      borderTop: '1px solid var(--map-b1)',
      padding: '5px 10px',
      zIndex: 20,
    }}>
      {/* Label row */}
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        color: 'var(--map-t2)',
        letterSpacing: '0.06em',
        marginBottom: 4,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{stageName}</span>
        <span style={{ color: '#60aaee' }}>{pct}%</span>
      </div>

      {/* Progress track */}
      <div style={{ height: 4, background: 'var(--map-b1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: '#1a6aaa',
          width: `${pct}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
        {STAGES.map((stage, i) => {
          const isDone = i < stageIdx && jobStatus === 'running';
          const isNow = i === stageIdx && jobStatus === 'running';
          return (
            <span key={stage} style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: isDone ? '#40c870' : isNow ? '#60aaee' : 'var(--map-t3)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}>
              {isDone ? '●' : isNow ? '◉' : '○'} {stage}
            </span>
          );
        })}
      </div>
    </div>
  );
}



