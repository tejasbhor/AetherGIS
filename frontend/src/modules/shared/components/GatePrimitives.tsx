import React from 'react';
import { Link } from 'react-router-dom';

interface GateTopNavProps {
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const GateTopNav: React.FC<GateTopNavProps> = ({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = 'Request Access',
  secondaryLabel = 'Sign In',
}) => (
  <header className="ag-bridge-nav" aria-label="Product navigation bridge">
    <div className="ag-bridge-nav-inner">
      <Link to="/" className="ag-bridge-logo" aria-label="AetherGIS home">
        <img src="/icon.png" alt="" className="ag-bridge-logo-icon" aria-hidden="true" />
        <span className="ag-bridge-logo-text">AetherGIS</span>
      </Link>

      <nav className="ag-bridge-links" aria-label="Primary">
        <Link to="/product">Product</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/docs">Documentation</Link>
      </nav>

      <div className="ag-bridge-actions">
        <button type="button" className="ag-bridge-btn ag-bridge-btn-ghost" onClick={onSecondaryAction}>
          {secondaryLabel}
        </button>
        <button type="button" className="ag-bridge-btn ag-bridge-btn-primary" onClick={onPrimaryAction}>
          {primaryLabel}
        </button>
      </div>
    </div>
  </header>
);

export const OrbitRings: React.FC = () => (
  <div className="ag-orbit-container" aria-hidden="true">
    <div className="ag-orbit ag-orbit-1" />
    <div className="ag-orbit ag-orbit-2" />
    <div className="ag-orbit ag-orbit-3" />
    <div className="ag-orbit-dot ag-orbit-dot-1" />
    <div className="ag-orbit-dot ag-orbit-dot-2" />
  </div>
);

export const GateLogo: React.FC<{ gradientId?: string }> = ({ gradientId = 'ag-grad-shared' }) => (
  <div className="ag-logo" role="img" aria-label="AetherGIS">
    <svg className="ag-logo-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke={`url(#${gradientId})`} strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="24" r="12" stroke={`url(#${gradientId})`} strokeWidth="1.5" opacity="0.9" />
      <circle cx="24" cy="24" r="4" fill={`url(#${gradientId})`} />
      <ellipse cx="24" cy="24" rx="20" ry="8" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.4" />
      <ellipse cx="24" cy="24" rx="20" ry="14" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.25" />
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2fd67c" />
        </linearGradient>
      </defs>
    </svg>
    <div className="ag-logo-text">
      <span className="ag-logo-name">AetherGIS</span>
      <span className="ag-logo-tagline">GeoAI Intelligence Platform</span>
    </div>
  </div>
);

export const StatusBadge: React.FC<{ label: string; variant?: 'default' | 'warning' | 'error' }> = ({
  label,
  variant = 'default',
}) => (
  <div className={`ag-status-badge ag-status-badge--${variant}`} role="status">
    <span className="ag-status-dot" aria-hidden="true" />
    {label}
  </div>
);
