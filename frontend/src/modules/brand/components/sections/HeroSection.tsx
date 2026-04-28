import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target, ShieldCheck, Globe, BrainCircuit, Satellite, Lock } from "lucide-react";

interface HeroSectionProps {
  onEnterDashboard?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onEnterDashboard }) => {
  return (
    <div className="brand-hero-overlay">
      <div className="brand-hero-left">
        <p className="brand-hero-tag">
          <span className="brand-hero-tag-dot" />
          AI-POWERED WEBGIS PLATFORM
        </p>

        <h1>
          See Earth
          <br />
          as it truly
          <br />
          <span>moves.</span>
        </h1>

        <p className="brand-hero-desc">
          AetherGIS transforms temporally sparse satellite imagery into
          continuous, interpretable visual sequences using AI-powered
          interpolation — with built-in{" "}
          <em className="brand-hero-em">accuracy control</em>.
        </p>

        <div className="brand-hero-actions">
          <button className="brand-btn brand-btn-primary brand-btn-lg brand-cta-button" onClick={onEnterDashboard}>
            Launch Workspace <ArrowRight size={15} strokeWidth={2.2} />
          </button>
          <Link
            to="/docs"
            className="brand-btn brand-btn-ghost brand-btn-lg brand-hero-ghost-btn"
          >
            Read Documentation
          </Link>
        </div>

        <div className="brand-hero-features">
          <div className="brand-hero-feature">
            <Target size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
            <div>
              <strong>ACCURACY AWARE</strong>
              <span>Accuracy-aware interpolation</span>
            </div>
          </div>
          <div className="brand-hero-feature">
            <ShieldCheck size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
            <div>
              <strong>CONFIDENCE SCORED</strong>
              <span>Confidence-scored outputs</span>
            </div>
          </div>
          <div className="brand-hero-feature">
            <Globe size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
            <div>
              <strong>WEBGIS NATIVE</strong>
              <span>WebGIS-native visualization</span>
            </div>
          </div>
        </div>
      </div>

      <div className="brand-hero-right">
        <div className="brand-hero-frame">
          <div className="brand-hero-frame-bar">
            <span className="brand-dot" />
            <span className="brand-hero-frame-label">AetherGIS v2.0</span>
            <span className="brand-hero-frame-status">● LIVE</span>
          </div>
          <img
            src="/landing/hero-dashboard.webp"
            alt="AetherGIS dashboard interface"
            draggable={false}
          />
        </div>
      </div>

      <div className="brand-hero-bottom-bar">
        <div className="brand-hero-bottom-item">
          <BrainCircuit size={28} strokeWidth={1.5} className="brand-bottom-icon" />
          <div>
            <strong>Powered by AI</strong>
            <span>RIFE / FILM interpolation<br />with optical flow validation</span>
          </div>
        </div>
        <div className="brand-hero-bottom-divider" />
        <div className="brand-hero-bottom-item">
          <Satellite size={28} strokeWidth={1.5} className="brand-bottom-icon" />
          <div>
            <strong>Multiple Data Sources</strong>
            <span>NASA GIBS (Cloud)<br />MOSDAC (Local)</span>
          </div>
        </div>
        <div className="brand-hero-bottom-divider" />
        <div className="brand-hero-bottom-item">
          <Target size={28} strokeWidth={1.5} className="brand-bottom-icon" />
          <div>
            <strong>Accuracy First</strong>
            <span>Confidence scoring<br />&amp; quality control</span>
          </div>
        </div>
        <div className="brand-hero-bottom-divider" />
        <div className="brand-hero-bottom-item">
          <Lock size={28} strokeWidth={1.5} className="brand-bottom-icon" />
          <div>
            <strong>Controlled Access</strong>
            <span>Queue-based sessions<br />for stable resources</span>
          </div>
        </div>
        <div className="brand-hero-bottom-divider" />
        <div className="brand-hero-bottom-item">
          <Globe size={28} strokeWidth={1.5} className="brand-bottom-icon" />
          <div>
            <strong>WebGIS Native</strong>
            <span>Interactive, fast and<br />cross-platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
