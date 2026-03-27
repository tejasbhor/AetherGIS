/**
 * TemporalGIS — Playback controls: play/pause/step/speed + metadata toggle.
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function PlaybackControls() {
  const {
    pipelineResult,
    currentFrameIndex, setCurrentFrameIndex,
    isPlaying, setIsPlaying,
    playbackSpeed, setPlaybackSpeed,
    showMetadataOverlay, setShowMetadataOverlay,
    showLowConfidence, setShowLowConfidence,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frames = pipelineResult?.frames || [];
  const totalFrames = frames.length;
  const currentMeta = frames[currentFrameIndex];

  // Auto-play timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || totalFrames === 0) return;

    const delay = Math.round(1000 / (10 * playbackSpeed)); // base 10fps
    intervalRef.current = setInterval(() => {
      const { currentFrameIndex: liveFrameIndex } = useStore.getState();
      if (liveFrameIndex >= totalFrames - 1) {
        setIsPlaying(false);
        return;
      }
      setCurrentFrameIndex(liveFrameIndex + 1);
    }, delay);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, playbackSpeed, totalFrames]);

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(Math.min(totalFrames - 1, currentFrameIndex + 1));
  };

  const handlePlayPause = () => {
    if (currentFrameIndex >= totalFrames - 1) setCurrentFrameIndex(0);
    setIsPlaying(!isPlaying);
  };

  const iconBtn = (label: string, onClick: () => void, disabled = false, active = false) => (
    <button
      className={`btn btn-ghost btn-icon${active ? ' active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{ fontSize: 14 }}
    >
      {label}
    </button>
  );

  const hasResult = totalFrames > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '0 4px',
    }}>
      {/* Frame counter */}
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        F{currentFrameIndex + 1}/{totalFrames || 0}
      </div>

      {/* Transport controls */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {iconBtn('⏮', () => { setIsPlaying(false); setCurrentFrameIndex(0); }, !hasResult)}
        {iconBtn('⏪', handleStepBack, !hasResult || currentFrameIndex === 0)}
        <button
          className="btn btn-primary btn-icon"
          onClick={handlePlayPause}
          disabled={!hasResult}
          style={{ fontSize: 14, width: 36, height: 36 }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        {iconBtn('⏩', handleStepForward, !hasResult || currentFrameIndex >= totalFrames - 1)}
        {iconBtn('⏭', () => { setIsPlaying(false); setCurrentFrameIndex(totalFrames - 1); }, !hasResult)}
      </div>

      {/* Speed selector */}
      <div style={{ display: 'flex', gap: 3 }}>
        {([0.5, 1, 2, 4] as const).map((s) => (
          <button
            key={s}
            className={`btn btn-ghost${playbackSpeed === s ? ' active' : ''}`}
            style={{ padding: '4px 8px', fontSize: 11, minWidth: 32 }}
            onClick={() => setPlaybackSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Timestamp display */}
      {currentMeta && (
        <div style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: currentMeta.is_interpolated ? 'var(--conf-medium)' : 'var(--conf-observed)',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'center',
        }}>
          {new Date(currentMeta.timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC
          {currentMeta.is_interpolated && ' · AI'}
        </div>
      )}

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          className="toggle-wrap"
          onClick={() => setShowMetadataOverlay(!showMetadataOverlay)}
          style={{ cursor: 'pointer' }}
          title="Toggle metadata overlay"
        >
          <div className={`toggle${showMetadataOverlay ? ' on' : ''}`} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overlay</span>
        </div>
        <div
          className="toggle-wrap"
          onClick={() => setShowLowConfidence(!showLowConfidence)}
          style={{ cursor: 'pointer' }}
          title="Show low confidence frames"
        >
          <div className={`toggle${showLowConfidence ? ' on' : ''}`} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Low-Conf</span>
        </div>
      </div>
    </div>
  );
}

