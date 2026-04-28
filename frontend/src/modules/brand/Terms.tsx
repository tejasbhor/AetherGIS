import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  Scale,
  Ban,
  AlertTriangle
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const Terms: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Terms of Use</p>
        <h1>Terms of Service</h1>
        <p className="brand-security-hero-sub">
          These terms govern your use of AetherGIS. By accessing the platform, you agree
          to follow these conditions and acknowledge the limitations of AI-generated outputs.
        </p>
      </header>

      {/* ── KPIs ── */}
      <div className="brand-security-kpis">
        {[
          { stat: 'AS-IS',       label: 'Service provided without warranty' },
          { stat: 'Queue-Based',  label: 'Fair compute allocation' },
          { stat: 'Single-Session', label: 'One active session at a time' },
          { stat: 'Revocable',    label: 'Access may be restricted' },
        ].map(({ stat, label }) => (
          <div key={stat} className="brand-security-kpi">
            <span className="brand-security-kpi-stat">{stat}</span>
            <span className="brand-security-kpi-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Terms Cards ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Service Terms</p>
        <div className="brand-security-grid">

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <FileText size={20} strokeWidth={1.5} />
            </div>
            <h3>Service Scope</h3>
            <p>
              AetherGIS provides AI-assisted temporal interpolation of satellite imagery for
              qualitative analysis and visual interpretation. The service is provided "as-is"
              without warranties of fitness for specific purposes.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-cyan">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <h3>Acceptable Use</h3>
            <p>
              You agree not to misuse compute resources, bypass queue controls, or attempt
              unauthorized access to platform systems or data. Abuse of the service may result
              in access suspension.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-green">
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <h3>Availability</h3>
            <p>
              Access may be restricted by deployment mode, maintenance windows, and session-lock
              policies designed to ensure platform stability. Queue-based compute allocation
              limits concurrent usage to a single active session.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-purple">
              <Scale size={20} strokeWidth={1.5} />
            </div>
            <h3>Liability</h3>
            <p>
              Generated outputs are informational and may contain reconstruction artifacts. You
              remain responsible for any interpretation or downstream use. AetherGIS and its
              operators are not liable for decisions made based on interpolated content.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-orange">
              <Ban size={20} strokeWidth={1.5} />
            </div>
            <h3>Resource Fair Use</h3>
            <p>
              Compute resources are shared and limited. Excessive job submissions, deliberate
              queue circumvention, or abuse of the authentication flow will trigger access
              restrictions.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <AlertTriangle size={20} strokeWidth={1.5} />
            </div>
            <h3>Output Accuracy</h3>
            <p>
              AI-generated outputs are subjective interpolations, not ground truth. No guarantees
              are made regarding temporal, spectral, or radiometric accuracy.
            </p>
          </article>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="brand-security-contact">
        <h2>Questions about these terms?</h2>
        <p>
          If you need clarification on acceptable use or have questions about platform access,
          our team is here to help.
        </p>
        <Link to="/contact" className="brand-btn brand-btn-primary">
          Contact the Team
        </Link>
      </section>

    </BrandPageShell>
  );
};

export default Terms;
