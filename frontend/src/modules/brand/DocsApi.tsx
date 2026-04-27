import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const DocsApi: React.FC = () => {
  return (
    <BrandPageShell contentClassName="brand-legal-layout">
      <article className="brand-legal-card">
        <header>
          <p className="eyebrow">Docs</p>
          <h1>API Reference</h1>
        </header>
        <section>
          <h2>POST /api/v1/pipeline/run</h2>
          <p>Submit a pipeline request with AOI, temporal range, and selected source/layer.</p>
        </section>
        <section>
          <h2>GET /api/v1/jobs/{`{job_id}`}/status</h2>
          <p>Poll queue/running/completed states with progress and message updates.</p>
        </section>
        <section>
          <h2>GET /api/v1/jobs/{`{job_id}`}/results</h2>
          <p>Retrieve generated frames, confidence payloads, and associated metadata.</p>
        </section>
      </article>
    </BrandPageShell>
  );
};

export default DocsApi;
