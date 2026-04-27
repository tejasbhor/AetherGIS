import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  Server,
  Globe,
  Satellite
} from 'lucide-react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const sources = [
  {
    icon: Cloud,
    color: 'blue',
    status: 'active',
    name: 'NASA GIBS',
    type: 'Cloud (Primary)',
    description: 'Global satellite imagery layers served via WMS. Supports multiple satellite modalities and temporal resolutions. Auto-updating feed.',
    details: '7–8 day revisit, global coverage, 250m–1km resolution',
  },
  {
    icon: Server,
    color: 'cyan',
    status: 'planned',
    name: 'MOSDAC INSAT',
    type: 'Local / Extended',
    description: 'Indian meteorological satellite data from MOSDAC. Enables regional high-frequency monitoring over South Asia. Requires local deployment.',
    details: '30-min revisit, South Asia focus, 1km resolution',
  },
  {
    icon: Globe,
    color: 'green',
    status: 'future',
    name: 'ISRO Bhuvan',
    type: 'Future Scope',
    description: 'Planned integration with Bhuvan geoportal for additional Indian regional datasets, LULC layers, and thematic maps.',
    details: 'Multi-spectral, multi-resolution, thematic datasets',
  },
];

const DataSourcesPage: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-security-layout">

      {/* ── Hero ── */}
      <header className="brand-security-hero">
        <p className="eyebrow">Data Sources</p>
        <h1>Built on real satellite data</h1>
        <p className="brand-security-hero-sub">
          AetherGIS transforms actual satellite observations into continuous visual sequences.
          Our sources are authoritative, our methods are transparent.
        </p>
      </header>

      {/* ── Source Cards ── */}
      <section className="brand-security-section">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Available Providers</p>
        <div className="brand-sources-grid">
          {sources.map((source, idx) => {
            const IconComponent = source.icon;
            const statusColors: Record<string, string> = {
              active:   '#4ade80',
              planned:  '#f59e0b',
              future:   '#8b5cf6',
            };
            const statusLabels: Record<string, string> = {
              active:   'Active',
              planned:  'Planned',
              future:   'Future',
            };
            return (
              <article key={idx} className="brand-source-card">
                <div className="brand-source-header">
                  <div className={`brand-source-icon brand-source-icon-${source.color}`}>
                    <IconComponent size={22} strokeWidth={1.5} />
                  </div>
                  <span
                    className="brand-source-status"
                    style={{ color: statusColors[source.status] }}
                  >
                    {statusLabels[source.status]}
                  </span>
                </div>
                <h3>{source.name}</h3>
                <p className="brand-source-type">{source.type}</p>
                <p>{source.description}</p>
                <div className="brand-source-meta">
                  <Satellite size={14} />
                  <span>{source.details}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Cloud vs Local Note ── */}
      <section className="brand-security-responsible">
        <div className="brand-security-responsible-content">
          <p className="eyebrow">Deployment Modes</p>
          <h2>Cloud vs Local Execution</h2>
          <p>
            In cloud deployments, only NASA GIBS is available due to API constraints. Local
            deployments can configure MOSDAC and other WMS providers for regional datasets.
            All data providers remain subject to their respective terms of use.
          </p>
        </div>
        <div className="brand-security-responsible-aside">
          <div className="brand-security-disclaimer-card">
            <h4>Data Provenance</h4>
            <p>
              AetherGIS does not store or redistribute raw source data. All imagery is streamed
              from provider WMS endpoints and transformed in ephemeral pipeline sessions.
            </p>
            <Link to="/privacy" className="brand-security-disclaimer-link">
              View privacy policy →
            </Link>
          </div>
        </div>
      </section>

    </BrandPageShell>
  );
};

export default DataSourcesPage;
