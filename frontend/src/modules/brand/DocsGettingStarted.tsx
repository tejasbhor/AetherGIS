import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const DocsGettingStarted: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-legal-layout">
      <article className="brand-legal-card">
        <header>
          <p className="eyebrow">Docs</p>
          <h1>Getting Started</h1>
        </header>
        <section>
          <h2>1. Open Dashboard</h2>
          <p>Use local mode for development or authenticated mode for production access.</p>
        </section>
        <section>
          <h2>2. Configure AOI and Time</h2>
          <p>Select region, date range, and data source before running the pipeline.</p>
        </section>
        <section>
          <h2>3. Run and Review</h2>
          <p>Monitor queue status, inspect generated frames, and export outputs as needed.</p>
        </section>
      </article>
    </BrandPageShell>
  );
};

export default DocsGettingStarted;
