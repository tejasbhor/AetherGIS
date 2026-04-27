import React from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const StatusPage: React.FC = () => {
  return (
    <BrandPageShell>
      <section className="brand-generic-page">
        <p className="eyebrow">Operations</p>
        <h1>System Status</h1>
        <div className="brand-status-grid">
          <article><h3>NASA GIBS</h3><p className="ok">Active</p></article>
          <article><h3>MOSDAC (Local)</h3><p className="ok">Active</p></article>
          <article><h3>Queue System</h3><p className="ok">Operational</p></article>
          <article><h3>Interpolation Engine</h3><p className="ok">Healthy</p></article>
        </div>
      </section>
    </BrandPageShell>
  );
};

export default StatusPage;
