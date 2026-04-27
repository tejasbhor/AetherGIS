import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Database,
  Sparkles,
  CheckCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const steps = [
  {
    icon: MapPin,
    color: 'blue',
    stage: '01',
    title: 'Select Region & Time',
    description: 'Draw your AOI on the map, choose a satellite layer (NASA GIBS or MOSDAC), and define the temporal window. The system validates data availability before proceeding.',
  },
  {
    icon: Database,
    color: 'cyan',
    stage: '02',
    title: 'Fetch Source Observations',
    description: 'WMS tiles are ingested for each available timestamp within your window. Gaps are identified and logged for interpolation planning.',
  },
  {
    icon: Sparkles,
    color: 'green',
    stage: '03',
    title: 'Run AI Interpolation',
    description: 'RIFE/FILM models generate intermediate frames using optical flow guidance. Each frame receives a confidence score based on flow consistency.',
  },
  {
    icon: CheckCircle,
    color: 'purple',
    stage: '04',
    title: 'Validate & Score',
    description: 'Post-processing filters low-confidence frames. Confidence heatmaps are generated. A manifest records all parameters for reproducibility.',
  },
  {
    icon: Play,
    color: 'orange',
    stage: '05',
    title: 'Visualize & Export',
    description: 'Play back the sequence on the interactive timeline. Compare original vs. interpolated side-by-side. Export frames, video, or full manifests.',
  },
];

const HowItWorksPage: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">System Workflow</p>
        <h1>How AetherGIS Works</h1>
        <p className="brand-security-hero-sub">
          From region selection to validated output — a transparent pipeline designed for interpretable
          temporal enhancement of satellite imagery.
        </p>
      </header>

      {/* ── Process Timeline ── */}
      <section className="brand-how-section">
        <p className="eyebrow" style={{ marginBottom: 24 }}>The Pipeline</p>
        <div className="brand-how-timeline">

          {/* Connector line */}
          <div className="brand-how-line" />

          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={idx} className={`brand-how-step ${idx % 2 === 0 ? 'is-even' : 'is-odd'}`}>
                <div className={`brand-how-step-icon brand-how-icon-${step.color}`}>
                  <IconComponent size={20} strokeWidth={1.5} />
                  <span className="brand-how-stage">{step.stage}</span>
                </div>
                <div className="brand-how-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="brand-how-arrow">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </section>

      {/* ── Callout ── */}
      <section className="brand-security-contact">
        <h2>Ready to run your first pipeline?</h2>
        <p>
          Access is limited to ensure stable compute allocation. Request access to begin.
        </p>
        <Link to="/access" className="brand-btn brand-btn-primary">
          Request Access
        </Link>
      </section>

    </BrandPageShell>
  );
};

export default HowItWorksPage;
