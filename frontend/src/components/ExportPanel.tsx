/**
 * TemporalGIS — Export panel: download original ZIP, interpolated ZIP, MP4, JSON.
 */
import { useStore } from '../store/useStore';
import { getVideoUrl, getMetadataUrl } from '../api/client';

export default function ExportPanel() {
  const { pipelineResult, jobId } = useStore();
  const hasResult = pipelineResult?.status === 'COMPLETED' && !!jobId;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a); // required for some browsers
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed, opening in new tab', e);
      window.open(url, '_blank');
    }
  };

  const ExportBtn = ({ label, icon, url, filename, disabled }: any) => (
    <button
      className="btn btn-ghost"
      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
      onClick={() => handleDownload(url, filename)}
      disabled={disabled || !hasResult}
      title={disabled || !hasResult ? 'Run a pipeline first' : undefined}
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="section-header">Export Results</div>

      {!hasResult && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '20px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          Run a pipeline first to unlock exports.
        </div>
      )}

      {hasResult && (
        <>
          {/* Quick stats */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
          }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Pipeline: <span style={{ color: 'var(--conf-high)' }}>COMPLETED</span></div>
            <div style={{ color: 'var(--text-muted)' }}>Total frames: {pipelineResult!.metrics?.total_frames}</div>
            <div style={{ color: 'var(--text-muted)' }}>Interpolated: {pipelineResult!.metrics?.interpolated_frames}</div>
            <div style={{ color: 'var(--text-muted)' }}>Observed: {pipelineResult!.metrics?.observed_frames}</div>
          </div>

          {/* Video downloads */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>🎬 Video Files</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <ExportBtn
                label="MP4 Video"
                icon="🎬"
                url={getVideoUrl(jobId!, 'interpolated')}
                filename={`temporalgis_interpolated_${jobId!.slice(0, 8)}.mp4`}
              />
              <ExportBtn
                label="Original"
                icon="📹"
                url={getVideoUrl(jobId!, 'original')}
                filename={`temporalgis_original_${jobId!.slice(0, 8)}.mp4`}
              />
            </div>
          </div>

          {/* Data downloads */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>📄 Data Files</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <ExportBtn
                label="Z7 Frames"
                icon="📦"
                url={`http://localhost:8000/api/v1/pipeline/${jobId!}/frames/0`}
                filename={`frames_${jobId!.slice(0, 8)}.zip`}
                disabled
              />
              <ExportBtn
                label="Engine Seq"
                icon="📊"
                url={getMetadataUrl(jobId!)}
                filename={`metadata_${jobId!.slice(0, 8)}.json`}
              />
            </div>
          </div>

          {/* Attribution */}
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 10,
          }}>
            <div>Data attribution:</div>
            <div>• NASA GIBS/EOSDIS — Imagery courtesy NASA/GIBS</div>
            <div>• AI interpolation: RIFE (hzwer/Practical-RIFE)</div>
            <div style={{ marginTop: 6, color: '#fca5a5' }}>
              ⚠ Interpolated frames are NOT observed data. Use original frames for scientific use.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
