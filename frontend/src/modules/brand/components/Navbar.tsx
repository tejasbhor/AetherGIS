import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSystemConfig } from '@shared/api/client';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { data: config } = useSystemConfig();
  const [isScrolled, setIsScrolled]           = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardRedirect = () => {
    if (config?.mode === 'production' || config?.is_dev_preview) {
      window.location.href = '/api/v1/auth/login';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const isActive = (path: string) =>
    path === '/docs'
      ? location.pathname.startsWith('/docs')
      : location.pathname === path;

  return (
    <nav className={`brand-nav ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="brand-nav-inner">

        {/* Logo — icon + stacked text */}
        <Link to="/" className="brand-logo">
          <img
            src="/icon.png"
            alt=""
            className="brand-logo-icon"
            aria-hidden="true"
          />
          <div className="brand-logo-text">
            <span className="brand-logo-title">AetherGIS</span>
            <span className="brand-logo-subtitle">AI-Based Temporal Enhancement</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="brand-nav-links">
          <Link to="/"             className={`brand-nav-link ${isActive('/')             ? 'is-active' : ''}`}>Product</Link>
          <Link to="/how-it-works" className={`brand-nav-link ${isActive('/how-it-works') ? 'is-active' : ''}`}>How It Works</Link>
          <Link to="/features"     className={`brand-nav-link ${isActive('/features')     ? 'is-active' : ''}`}>Features</Link>
          <Link to="/data-sources" className={`brand-nav-link ${isActive('/data-sources') ? 'is-active' : ''}`}>Data Sources</Link>
          <Link to="/docs"         className={`brand-nav-link ${isActive('/docs')         ? 'is-active' : ''}`}>Documentation</Link>
          <Link to="/about"        className={`brand-nav-link ${isActive('/about')        ? 'is-active' : ''}`}>About</Link>
        </div>

        {/* Actions */}
        <div className="brand-nav-actions">
          <button className="brand-btn brand-btn-ghost"   onClick={handleDashboardRedirect}>Log In</button>
          <button className="brand-btn brand-btn-primary" onClick={handleDashboardRedirect}>Request Access</button>
        </div>

        {/* Mobile toggle */}
        <button
          className="brand-nav-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`brand-mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="brand-mobile-links">
          <Link to="/"             onClick={() => setIsMobileMenuOpen(false)}>Product</Link>
          <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How It Works</Link>
          <Link to="/features"     onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link to="/data-sources" onClick={() => setIsMobileMenuOpen(false)}>Data Sources</Link>
          <Link to="/docs"         onClick={() => setIsMobileMenuOpen(false)}>Documentation</Link>
          <Link to="/about"        onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link to="/contact"      onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          <Link to="/security"     onClick={() => setIsMobileMenuOpen(false)}>Security</Link>
          <Link to="/status"       onClick={() => setIsMobileMenuOpen(false)}>Status</Link>
          <Link to="/privacy"      onClick={() => setIsMobileMenuOpen(false)}>Privacy</Link>
          <Link to="/terms"        onClick={() => setIsMobileMenuOpen(false)}>Terms</Link>
          <button
            className="brand-btn brand-btn-primary"
            onClick={() => { handleDashboardRedirect(); setIsMobileMenuOpen(false); }}
          >
            Request Access
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
