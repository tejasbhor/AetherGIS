/**
 * AetherGIS — Advanced Overlays Control Panel (Modules 1–10).
 * Extends the existing LayerControls WITHOUT removing anything.
 * All toggles default to OFF.
 */
import { useStore } from '../store/useStore';

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
  loading?: boolean;
  opacityKey?: string;
}

function ToggleRow({ id, label, checked, onChange, color = 'var(--teal)', loading = false, opacityKey }: ToggleRowProps) {
  const { overlayOpacity, setOverlayOpacity } = useStore();
  const opacity = opacityKey ? (overlayOpacity[opacityKey] ?? 0.7) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        className="check-row"
        onClick={onChange}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}
      >
        <input type="checkbox" id={id} checked={checked} onChange={onChange} />
        <label
          className="check-label"
          htmlFor={id}
          style={{ color: checked ? color : 'var(--t3)', cursor: 'pointer', flex: 1, fontSize: 10 }}
        >
          {label}
        </label>
        {loading && <span style={{ fontSize: 8, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>⧗</span>}
        {checked && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: color, flexShrink: 0,
            boxShadow: `0 0 4px ${color}`,
          }} />
        )}
      </div>
      {checked && opacityKey && opacity !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0 4px 16px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t4)', width: 42 }}>opacity</span>
          <input
            type="range" className="range" min={0} max={1} step={0.05}
            value={opacity}
            style={{ flex: 1 }}
            onChange={(e) => setOverlayOpacity(opacityKey, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', width: 22 }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function AdvancedOverlaysPanel() {
  const {
    pipelineResult,
    showTrajectories, setShowTrajectories,
    showUncertaintyMap, setShowUncertaintyMap,
    showChangeMap, setShowChangeMap,
    showAnomalies, setShowAnomalies,
    showExplainability, setShowExplainability,
    enablePrediction, setEnablePrediction,
    loadingTrajectories, loadingAlerts, loadingPredictions,
    loadingHeatmap,
  } = useStore();

  const hasResult = !!pipelineResult;

  const toggles = [
    {
      id: 'adv-traj',
      label: 'Show Trajectories',
      checked: showTrajectories,
      onChange: () => setShowTrajectories(!showTrajectories),
      color: 'var(--teal)',
      loading: loadingTrajectories,
      opacityKey: 'trajectories',
    },
    {
      id: 'adv-uncert',
      label: 'Show Uncertainty Map',
      checked: showUncertaintyMap,
      onChange: () => setShowUncertaintyMap(!showUncertaintyMap),
      color: 'var(--orange)',
      loading: loadingHeatmap['uncertainty'],
      opacityKey: 'uncertainty',
    },
    {
      id: 'adv-change',
      label: 'Show Change Map',
      checked: showChangeMap,
      onChange: () => setShowChangeMap(!showChangeMap),
      color: '#a78bfa',
      loading: loadingHeatmap['motion'],
      opacityKey: 'change',
    },
    {
      id: 'adv-anom',
      label: 'Show Anomalies',
      checked: showAnomalies,
      onChange: () => setShowAnomalies(!showAnomalies),
      color: 'var(--red)',
      loading: loadingAlerts,
      opacityKey: 'anomaly',
    },
    {
      id: 'adv-explain',
      label: 'Show Explainability',
      checked: showExplainability,
      onChange: () => setShowExplainability(!showExplainability),
      color: '#22d3ee',
      opacityKey: 'explainability',
    },
    {
      id: 'adv-predict',
      label: 'Enable Prediction',
      checked: enablePrediction,
      onChange: () => setEnablePrediction(!enablePrediction),
      color: '#f472b6',
      loading: loadingPredictions,
    },
  ];

  return (
    <>
      <div className="section-hdr" style={{ marginTop: 0 }}>
        Advanced Overlays
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 8,
          color: 'var(--blue)', background: 'var(--blue-bg)',
          border: '1px solid var(--blue-lt)', padding: '1px 5px', borderRadius: 3,
        }}>
          NEW
        </span>
      </div>
      <div className="section-body" style={{ paddingBottom: 6 }}>
        {!hasResult && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t4)', fontStyle: 'italic', marginBottom: 6 }}>
            Run a pipeline to enable overlays.
          </div>
        )}
        {toggles.map((t) => (
          <ToggleRow
            key={t.id}
            {...t}
            onChange={hasResult ? t.onChange : () => {}}
          />
        ))}
        {hasResult && (
          <div style={{ marginTop: 6, padding: '4px 6px', background: 'var(--b2)', border: '1px solid var(--b3)', borderRadius: 3 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t4)', lineHeight: 1.5 }}>
              Layers stack independently · Toggle any combination · Opacity per layer
            </div>
          </div>
        )}
      </div>
    </>
  );
}
