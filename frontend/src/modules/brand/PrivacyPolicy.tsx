import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  Server,
  Database,
  Globe
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Privacy Policy</p>
        <h1>How we handle your data</h1>
        <p className="brand-security-hero-sub">
          AetherGIS collects only what is necessary to operate the platform. We prioritize
          minimal data retention, secure transport, and transparent usage policies.
        </p>
      </header>

      {/* ── KPIs ── */}
      <div className="brand-security-kpis">
        {[
          { stat: 'OAuth 2.0',    label: 'Authentication standard' },
          { stat: 'Zero PII',     label: 'No personal data stored' },
          { stat: 'HTTPS',        label: 'End-to-end encryption' },
          { stat: 'Auto-Purge',   label: 'Automatic data retention' },
        ].map(({ stat, label }) => (
          <div key={stat} className="brand-security-kpi">
            <span className="brand-security-kpi-stat">{stat}</span>
            <span className="brand-security-kpi-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Privacy Controls ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Privacy Controls</p>
        <div className="brand-security-grid">

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <Shield size={20} strokeWidth={1.5} />
            </div>
            <h3>Data Collected</h3>
            <p>
              We collect account identity details (where authentication is enabled), job parameters
              (AOI, time range, layer selection), and platform telemetry required for service
              reliability and error tracing.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-cyan">
              <Eye size={20} strokeWidth={1.5} />
            </div>
            <h3>Data Usage</h3>
            <p>
              Data is used solely to execute interpolation jobs, deliver outputs, monitor platform
              health, and improve runtime quality controls. Aggregated, anonymized telemetry may
              guide product direction.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-green">
              <Database size={20} strokeWidth={1.5} />
            </div>
            <h3>Storage & Retention</h3>
            <p>
              Job metadata and artifacts are stored with controlled access. Completed job outputs
              are automatically purged after a configurable period to minimize data footprint.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-purple">
              <Server size={20} strokeWidth={1.5} />
            </div>
            <h3>Transport Security</h3>
            <p>
              All production endpoints are served over HTTPS with HSTS headers. WSS secures
              real-time job status connections. Certificates are managed and rotated automatically.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-orange">
              <Globe size={20} strokeWidth={1.5} />
            </div>
            <h3>Third-Party Sources</h3>
            <p>
              Satellite data from NASA GIBS and MOSDAC follows each provider's terms. AetherGIS
              acts as a consumer and transformation layer — we do not redistribute raw source data.
            </p>
          </article>

          <article className="brand-security-card">
            <div className="brand-security-card-icon brand-security-icon-blue">
              <Lock size={20} strokeWidth={1.5} />
            </div>
            <h3>No Personal Storage</h3>
            <p>
              AetherGIS does not store personally identifiable information beyond session
              management. Pipeline inputs are ephemeral per-job parameters.
            </p>
          </article>

        </div>
      </section>

      {/* ── Legal Notice ── */}
      <section className="brand-security-responsible">
        <div className="brand-security-responsible-content">
          <p className="eyebrow">Data Protection</p>
          <h2>We're committed to data stewardship</h2>
          <p>
            Every system is designed with the principle of least privilege and minimal
            data collection. If you have questions about how your data is handled, please
            <strong> contact us</strong>.
          </p>
        </div>
        <div className="brand-security-responsible-aside">
          <div className="brand-security-disclaimer-card">
            <h4>Platform Disclaimer</h4>
            <p>
              AI-interpolated outputs are synthetic approximations intended for qualitative
              analysis only. They are not suitable for scientific measurement or operational
              forecasting without domain expert review.
            </p>
            <Link to="/disclaimer" className="brand-security-disclaimer-link">
              Read full disclaimer →
            </Link>
          </div>
        </div>
      </section>

    </BrandPageShell>
  );
};

export default PrivacyPolicy;
