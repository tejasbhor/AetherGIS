import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  BarChart3,
  Layers,
  Eye,
  Boxes,
  HardDrive,
  Network,
  Cpu
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const features = [
  {
    icon: Brain,
    color: 'blue',
    title: 'Neural Frame Synthesis',
    description: 'RIFE and FILM models generate smooth intermediate frames using optical flow guidance, preserving temporal coherence across satellite imagery sequences.',
  },
  {
    icon: BarChart3,
    color: 'cyan',
    title: 'Confidence Scoring',
    description: 'Every generated frame carries a scalar confidence value. Low-confidence regions are visually flagged, ensuring you always know what is real versus reconstructed.',
  },
  {
    icon: Layers,
    color: 'green',
    title: 'Multi-Layer Overlays',
    description: 'Toggle confidence heatmaps, edge detection, and displacement vectors. Inspect quality metrics without leaving the map view.',
  },
  {
    icon: Eye,
    color: 'purple',
    title: 'Side-by-Side Comparison',
    description: 'A/B comparison mode shows original vs. interpolated frames synchronized. Pixel-difference highlighting reveals subtle changes.',
  },
  {
    icon: Boxes,
    color: 'orange',
    title: 'Queue-Based Compute',
    description: 'Single-session GPU locking ensures stable performance. No resource contention — your session gets full compute access when active.',
  },
  {
    icon: HardDrive,
    color: 'blue',
    title: 'Flexible Export',
    description: 'Export individual frames, video sequences, or complete manifests with metadata. All outputs include run parameters for reproducibility.',
  },
  {
    icon: Network,
    color: 'cyan',
    title: 'WMS Compatibility',
    description: 'Built on OGC standards. Connect any WMS-compliant satellite data source through our adapter pattern — not locked to a single provider.',
  },
  {
    icon: Cpu,
    color: 'green',
    title: 'GPU Acceleration',
    description: 'NVIDIA CUDA-accelerated models run at interactive speeds. What once took hours now happens in minutes on a single GPU.',
  },
];

const ProductPage: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Product</p>
        <h1>AetherGIS Features</h1>
        <p className="brand-security-hero-sub">
          AetherGIS combines temporal AI reconstruction with a production WebGIS workflow designed for
          interpretable environmental analysis.
        </p>
      </header>

      {/* ── Capabilities Grid ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Core Capabilities</p>
        <div className="brand-security-grid">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <article key={idx} className="brand-security-card">
                <div className={`brand-security-card-icon brand-security-icon-${feature.color}`}>
                  <IconComponent size={20} strokeWidth={1.5} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Technical Differentiation ── */}
      <section className="brand-security-responsible">
        <div className="brand-security-responsible-content">
          <p className="eyebrow">Why AetherGIS?</p>
          <h2>Not just interpolation — controlled interpolation</h2>
          <p>
            Most temporal interpolation tools treat motion as a black box. AetherGIS exposes every
            confidence score, produces reproducible manifests, and never disguises synthetic content
            as ground truth. You get the motion you need — with the transparency you demand.
          </p>
        </div>
        <div className="brand-security-responsible-aside">
          <div className="brand-security-disclaimer-card">
            <h4>Built for Research</h4>
            <p>
              From academic studies to operational monitoring, AetherGIS is engineered for use cases
              where interpretability and auditability are non-negotiable.
            </p>
            <Link to="/docs" className="brand-security-disclaimer-link">
              Read the documentation →
            </Link>
          </div>
        </div>
      </section>

    </BrandPageShell>
  );
};

export default ProductPage;
