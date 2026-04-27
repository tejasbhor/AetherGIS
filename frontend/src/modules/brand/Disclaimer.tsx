import React from 'react';
import { 
  AlertTriangle, 
  Brain, 
  ShieldAlert, 
  FileX,
  Scale,
  EyeOff
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const Disclaimer: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Important Disclaimer</p>
        <h1>Scientific & Operational Limitations</h1>
        <p className="brand-security-hero-sub">
          AetherGIS outputs are AI-generated approximations intended for qualitative analysis
          and visual exploration. They are not a substitute for authoritative satellite data
          or domain-expert interpretation.
        </p>
      </header>

      {/* ── KPIs ── */}
      <div className="brand-security-kpis">
        {[
          { stat: 'QUALITATIVE ONLY', label: 'Not for scientific measurement' },
          { stat: 'VISUAL PLAUSIBILITY', label: 'Synthetic approximations' },
          { stat: 'EXPERT REVIEW',    label: 'Domain validation required' },
          { stat: 'NO FORECASTING',   label: 'Unsuitable for predictions' },
        ].map(({ stat, label }) => (
          <div key={stat} className="brand-security-kpi">
            <span className="brand-security-kpi-stat">{stat}</span>
            <span className="brand-security-kpi-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Disclaimer Cards ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Key Limitations</p>
        <div className="brand-security-grid">

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <Brain size={20} strokeWidth={1.5} />
            </div>
            <h3>AI-Generated Approximation</h3>
            <p>
              Interpolated frames are synthesized by machine learning models and are not direct
              observations. They represent visually plausible transitions based on learned motion
              patterns, not measured reality.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-cyan">
              <ShieldAlert size={20} strokeWidth={1.5} />
            </div>
            <h3>Not for Measurement</h3>
            <p>
              Outputs are not suitable for scientific measurement, forecasting models, emergency
              response decisions, operational planning, or any critical workflow requiring
              validated scientific certainty.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-green">
              <FileX size={20} strokeWidth={1.5} />
            </div>
            <h3>Validation Responsibility</h3>
            <p>
              Users must independently validate all AI-generated outputs against authoritative
              source data before any operational or research use. Domain expertise is required
              to assess suitability for intended purposes.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-purple">
              <Scale size={20} strokeWidth={1.5} />
            </div>
            <h3>No Operational Guarantees</h3>
            <p>
              AetherGIS does not guarantee availability, accuracy, or completeness of any
              generated content. The platform may be modified or discontinued without prior
              notice.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-orange">
              <EyeOff size={20} strokeWidth={1.5} />
            </div>
            <h3>Interpretation At Your Risk</h3>
            <p>
              Visual plausibility does not equate to factual correctness. Interpolated frames
              may introduce artifacts that appear realistic but are fabrications.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <AlertTriangle size={20} strokeWidth={1.5} />
            </div>
            <h3>Liability</h3>
            <p>
              AetherGIS and its operators are not liable for decisions made based on
              interpolated outputs. Users bear full responsibility for how they use or
              interpret generated content.
            </p>
          </article>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="brand-security-contact">
        <h2>Need clarity?</h2>
        <p>
          Review the full terms or reach out if you have questions about responsible use.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="/terms" className="brand-btn brand-btn-ghost">Terms of Use</a>
          <a href="/contact" className="brand-btn brand-btn-primary">Contact</a>
        </div>
      </section>

    </BrandPageShell>
  );
};

export default Disclaimer;
