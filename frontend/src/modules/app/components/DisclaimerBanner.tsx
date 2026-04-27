/**
 * AetherGIS — Persistent scientific disclaimer banner (Rule FR-WEB-06).
 * Always visible when AI frames are in the sequence.
 */
import { useStore } from '@app/store/useStore';

export default function DisclaimerBanner() {
  const { pipelineResult } = useStore();
  const hasInterpolated = pipelineResult?.frames?.some((f) => f.is_interpolated);

  if (!hasInterpolated) return null;

  return (
    <div className="disclaimer-banner" role="alert" aria-live="polite">
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span>
        <strong>SCIENTIFIC DISCLAIMER:</strong>&nbsp;
        AI-interpolated frames are visual approximations only. Not suitable for scientific measurement,
        forecasting, operational use, or any safety-critical decisions.
      </span>
    </div>
  );
}
