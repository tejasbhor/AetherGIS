import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Timer,
  Boxes
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const steps = [
  {
    icon: FileText,
    color: 'blue',
    title: 'Submit Access Request',
    description: 'Share your use case details, expected usage volume, and institutional affiliation. This helps us allocate resources fairly.',
    note: 'Typically 1–2 business days for review',
  },
  {
    icon: ShieldCheck,
    color: 'cyan',
    title: 'Account Verification',
    description: 'Basic verification ensures eligibility. Production login credentials are issued upon approval. Local mode remains always available.',
    note: 'No personal data stored beyond session logs',
  },
  {
    icon: Timer,
    color: 'green',
    title: 'Queue-Based Sessions',
    description: 'Access the dashboard and submit jobs. The KOTH queue ensures only one session holds the GPU at any time — no contention.',
    note: 'First-come-first-served queue with position tracking',
  },
  {
    icon: Boxes,
    color: 'purple',
    title: 'Scheduled Compute',
    description: 'Your session runs with exclusive GPU access for the allocated window. When your time expires, the lock is released for the next user.',
    note: 'Default session duration: 2 hours',
  },
];

const AccessPage: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Access Model</p>
        <h1>Request Access</h1>
        <p className="brand-security-hero-sub">
          AetherGIS uses controlled access to maintain queue fairness and stable compute execution.
          Here is how the onboarding process works.
        </p>
      </header>

      {/* ── Process Cards ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Onboarding Flow</p>
        <div className="brand-access-grid">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <article key={idx} className="brand-access-card">
                <div className="brand-access-step-number">{String(idx + 1).padStart(2, '0')}</div>
                <div className={`brand-access-icon brand-access-icon-${step.color}`}>
                  <IconComponent size={20} strokeWidth={1.5} />
                </div>
                <div className="brand-access-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="brand-access-note">{step.note}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Queue System Callout ── */}
      <section className="brand-security-responsible">
        <div className="brand-security-responsible-content">
          <p className="eyebrow">Queue System</p>
          <h2>Why single-session locking?</h2>
          <p>
            GPU memory is a finite resource. Without a lock mechanism, concurrent jobs would compete
            for memory, leading to out-of-memory errors and unstable performance. The KOTH (King of
            the Hill) queue ensures only one pipeline runs at a time — guaranteeing consistent
            allocation and reproducible results.
          </p>
        </div>
        <div className="brand-security-responsible-aside">
          <div className="brand-security-disclaimer-card">
            <h4>Local Mode</h4>
            <p>
              For development or private deployment, local mode bypasses the queue entirely. Use
              it for testing, but production deployments enforce the lock for stability.
            </p>
            <Link to="/docs" className="brand-security-disclaimer-link">
              See deployment docs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="brand-security-contact">
        <h2>Need expedited access?</h2>
        <p>
          If you have an urgent research collaboration or institutional partnership, contact us
          directly for expedited review.
        </p>
        <div className="brand-security-contact-actions">
          <Link to="/docs" className="brand-btn brand-btn-ghost">Review Documentation</Link>
          <Link to="/contact" className="brand-btn brand-btn-primary">Request Priority Review</Link>
        </div>
      </section>

    </BrandPageShell>
  );
};

export default AccessPage;
