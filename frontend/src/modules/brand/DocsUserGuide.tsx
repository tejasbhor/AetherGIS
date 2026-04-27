import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const DocsUserGuide: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-legal-layout">
      <article className="brand-legal-card">
        <header>
          <p className="eyebrow">Docs</p>
          <h1>User Guide</h1>
        </header>
        <section>
          <h2>Dashboard Controls</h2>
          <p>Use map tools, layer controls, and timeline playback to inspect temporal outputs.</p>
        </section>
        <section>
          <h2>Analysis Panels</h2>
          <p>Review confidence metrics, interpolation insights, and run metadata.</p>
        </section>
        <section>
          <h2>Export Workflow</h2>
          <p>Download selected frames, generated sequences, and reporting artifacts.</p>
        </section>
      </article>
    </BrandPageShell>
  );
};

export default DocsUserGuide;
