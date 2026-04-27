import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const DocsAISystem: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-legal-layout">
      <article className="brand-legal-card">
        <header>
          <p className="eyebrow">Docs</p>
          <h1>AI & Accuracy System</h1>
        </header>
        <section>
          <h2>Optical Flow Validation</h2>
          <p>Frame transitions are evaluated to identify motion inconsistency and interpolation risk.</p>
        </section>
        <section>
          <h2>Confidence Scoring</h2>
          <p>Each generated frame is tagged with confidence categories to support interpretation.</p>
        </section>
        <section>
          <h2>Temporal Segmentation</h2>
          <p>Observed and synthetic segments are delineated for transparent visual storytelling.</p>
        </section>
      </article>
    </BrandPageShell>
  );
};

export default DocsAISystem;
