/**
 * AetherGIS — PipelineProgress overlay.
 * Shows on the map during active pipeline execution.
 * Per PRD: pipeline stages are WMS Fetch → Preprocess → Segment → AI Inference → Confidence → Video
 */
import { useStore } from '@app/store/useStore';

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
    <div className="map-progress visible">
      {/* Label row */}
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        color: 'var(--t3)',
        letterSpacing: '0.06em',
        marginBottom: 4,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{stageName}</span>
        <span style={{ color: 'var(--blue)' }}>{pct}%</span>
      </div>

      {/* Progress track */}
      <div className="mp-track">
        <div style={{
          height: '100%',
          background: 'var(--blue)',
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
              color: isDone ? 'var(--green)' : isNow ? 'var(--blue)' : 'var(--t4)',
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


