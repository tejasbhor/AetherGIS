import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const DocsArchitecture: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-legal-layout">
      <article className="brand-legal-card">
        <header>
          <p className="eyebrow">Docs</p>
          <h1>System Architecture</h1>
        </header>
        <section>
          <h2>Frontend</h2>
          <p>Vite + React modular monolith with strict Brand/App layer separation.</p>
        </section>
        <section>
          <h2>Backend</h2>
          <p>FastAPI services orchestrating ingestion, preprocessing, interpolation, and reporting.</p>
        </section>
        <section>
          <h2>Pipeline and Data Flow</h2>
          <p>Queued run manifests with checkpoints, confidence metadata, and export artifacts.</p>
        </section>
      </article>
    </BrandPageShell>
  );
};

export default DocsArchitecture;
