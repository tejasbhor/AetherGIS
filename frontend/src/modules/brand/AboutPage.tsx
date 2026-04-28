import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Workflow, 
  GitBranch, 
  Globe,
  Cpu,
  HardDrive,
  Boxes
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const Icons = {
  interpretable: Brain,
  clarity: Workflow,
  reproducible: GitBranch,
  agnostic: Globe,
};

const TechItems = [
  {
    title: 'Frontend',
    icon: Cpu,
    color: 'blue' as const,
    body: 'React 18 + Vite + TypeScript with strict alias boundaries between Brand and App modules.',
  },
  {
    title: 'Backend',
    icon: HardDrive,
    color: 'cyan' as const,
    body: 'FastAPI services orchestrate ingestion, preprocessing, AI interpolation, and reporting via Celery.',
  },
  {
    title: 'AI Models',
    icon: Brain,
    color: 'green' as const,
    body: 'RIFE and FILM models — NVIDIA CUDA-accelerated optical flow with per-frame confidence scoring.',
  },
  {
    title: 'Map Engine',
    icon: Globe,
    color: 'purple' as const,
    body: 'Leaflet.js (EPSG:4326) with interactive timeline scrubber, overlays, and side-by-side comparison.',
  },
  {
    title: 'Data Sources',
    icon: HardDrive,
    color: 'orange' as const,
    body: 'NASA GIBS cloud WMS tiles; local MOSDAC INSAT 3DR/3DS with server-side catalog discovery.',
  },
  {
    title: 'Queue & Access',
    icon: Boxes,
    color: 'blue' as const,
    body: 'KOTH single-session GPU lock ensures exclusive access; Google OAuth in production, bypassed locally.',
  },
];

const AboutPage: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-docs-layout-ref">

      {/* ── Left Sidebar ── */}
      <aside className="brand-docs-left-rail">
        <h3>About</h3>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#origin">Origin</a>
          <a href="#principles">Design Principles</a>
          <a href="#technology">Technology</a>
        </nav>
      </aside>

      {/* ── Main Panel ── */}
      <article className="brand-docs-main-panel">

        {/* ── Hero ── */}
        <header id="overview">
          <p className="eyebrow">About AetherGIS</p>
          <h1>Seeing Earth as it truly moves</h1>
          <p className="brand-docs-lead">
            AetherGIS was built to bridge the gap between discrete satellite snapshots and continuous
            motion understanding — making temporal earth observation workflows easier to explore,
            validate, and share.
          </p>
          <div className="brand-about-hero-divider" />
        </header>

        {/* ── Origin Story (Editorial split) ── */}
        <section id="origin" style={{ marginTop: 36 }}>
          <h2>The Gap In The Data</h2>
          <div className="brand-about-origin-grid">
            <div className="brand-about-origin-content">
              <p>
                Traditional remote sensing workflows treat satellite passes as isolated snapshots.
                When clouds, orbital constraints, or sensor downtime create gaps in coverage,
                analysts are left to mentally interpolate what happened in between.
              </p>
              <p>
                That gap is where errors compound and confidence evaporates. Missing frames become
                blind spots. Interpolated narratives replace measured reality.
              </p>
              <p>
                <strong>AetherGIS was designed around a single question:</strong> what if the gaps
                could be filled intelligently? Not with hallucinated data, but with physically-
                constrained optical flow estimates that carry explicit confidence scores — so the
                analyst always knows what they are looking at.
              </p>
            </div>
            <div className="brand-about-origin-visual">
              <div className="brand-about-origin-frame">
                <span className="brand-about-origin-label">Observed</span>
                <div className="brand-about-frame-solid" />
              </div>
              <div className="brand-about-origin-gap">
                <span className="brand-about-origin-label">Interpolated</span>
                <div className="brand-about-frame-dashed" />
              </div>
              <div className="brand-about-origin-frame">
                <span className="brand-about-origin-label">Observed</span>
                <div className="brand-about-frame-solid" />
              </div>
              <div className="brand-about-origin-axis">
                <span>Temporal Gap → AI fills with confidence</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Design Principles (Elevated cards) ── */}
        <section id="principles" style={{ marginTop: 48 }}>
          <h2>Design Principles</h2>
          <p className="brand-about-section-lead">
            Four core beliefs that shape every decision — from model selection to UI micro-interactions.
          </p>
          <div className="brand-about-principles">
            {[
              {
                icon: Icons.interpretable,
                title: 'Interpretable AI',
                body: 'Every synthetic frame carries an explicit is_synthetic flag and a scalar confidence score. The platform never presents interpolated content as ground truth.',
              },
              {
                icon: Icons.clarity,
                title: 'Operational Clarity',
                body: 'The pipeline lifecycle is transparent: ingest, preprocess, interpolate, validate, export. No black boxes between your request and the result.',
              },
              {
                icon: Icons.reproducible,
                title: 'Reproducibility',
                body: 'Every run produces a manifest with full parameter records. Results are deterministic for a given input set, GPU, and model version.',
              },
              {
                icon: Icons.agnostic,
                title: 'Source Agnosticism',
                body: 'NASA GIBS and MOSDAC INSAT are the first sources, but the WMS adapter pattern is open to any OGC-compliant provider.',
              },
            ].map((principle) => (
              <article key={principle.title} className="brand-about-principle-card">
                <div className="brand-about-principle-icon">
                  <principle.icon size={22} strokeWidth={1.5} />
                </div>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Technology Stack (Tech cards) ── */}
        <section id="technology" style={{ marginTop: 48 }}>
          <h2>Under The Hood</h2>
          <p className="brand-about-section-lead">
            From the React frontend to the FastAPI backend, from CUDA-accelerated AI to Leaflet's
            geospatial rendering — each layer is engineered for scale, precision, and extensibility.
          </p>
          <div className="brand-about-tech-grid">
            {TechItems.map((tech) => (
              <article key={tech.title} className="brand-security-card">
                <div className={`brand-security-card-icon brand-security-icon-${tech.color}`}>
                  <tech.icon size={20} strokeWidth={1.5} />
                </div>
                <h3>{tech.title}</h3>
                <p>{tech.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="brand-about-cta" style={{ marginTop: 56 }}>
          <h2>Ready to explore?</h2>
          <p>Read the documentation to get started, or request access to the platform.</p>
          <div className="brand-about-cta-actions">
            <Link to="/docs" className="brand-btn brand-btn-ghost">Review Documentation</Link>
            <Link to="/access" className="brand-btn brand-btn-primary">Request Platform Access</Link>
          </div>
        </section>

      </article>

      {/* ── Right Rail ── */}
      <aside className="brand-docs-right-rail">
        <section>
          <h4>On This Page</h4>
          <a href="#overview">Overview</a>
          <a href="#origin">Origin</a>
          <a href="#principles">Design Principles</a>
          <a href="#technology">Technology</a>
        </section>
        <section className="brand-docs-disclaimer-card">
          <h4>Important</h4>
          <p>
            AI-interpolated frames are synthetic approximations for qualitative analysis only.
            Not for scientific measurement or forecasting.
          </p>
        </section>
        <section>
          <h4>System Status</h4>
          <p>NASA GIBS: <span style={{ color: '#4ade80' }}>Active</span></p>
          <p>MOSDAC: <span style={{ color: '#4ade80' }}>Active</span></p>
          <p>Queue: <span style={{ color: '#4ade80' }}>Operational</span></p>
        </section>
      </aside>

    </BrandPageShell>
  );
};

export default AboutPage;
