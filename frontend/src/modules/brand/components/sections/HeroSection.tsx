import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Target, ShieldCheck, Globe, BrainCircuit, Satellite, Lock, PlayCircle, Users } from "lucide-react";
import { brandTransitions, inViewOnce } from "@brand/motion";

interface HeroSectionProps {
  onEnterDashboard?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onEnterDashboard }) => {
  return (
    <div className="brand-hero-overlay">
      <div className="brand-hero-left">
        <motion.p className="brand-hero-tag" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={brandTransitions.base} viewport={inViewOnce}>
          <span className="brand-hero-tag-dot" />
          AI-POWERED WEBGIS PLATFORM
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={brandTransitions.slow} viewport={inViewOnce}>
          See Earth
          <br />
          as it truly
          <br />
          <span>moves.</span>
        </motion.h1>

        <motion.p className="brand-hero-desc" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...brandTransitions.base, delay: 0.06 }} viewport={inViewOnce}>
          AetherGIS transforms temporally sparse satellite imagery into
          continuous, interpretable visual sequences using AI-powered
          interpolation — with built-in{" "}
          <em className="brand-hero-em">accuracy control</em>.
        </motion.p>

        <motion.div className="brand-hero-actions" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...brandTransitions.base, delay: 0.1 }} viewport={inViewOnce}>
          <button className="brand-btn brand-btn-primary brand-btn-lg brand-cta-button" onClick={onEnterDashboard}>
            Explore AetherGIS <ArrowRight size={15} strokeWidth={2.2} />
          </button>
          <Link
            to="/how-it-works"
            className="brand-btn brand-btn-ghost brand-btn-lg brand-hero-ghost-btn"
          >
            See How It Works <PlayCircle size={15} strokeWidth={1.9} />
          </Link>
        </motion.div>

        <motion.div className="brand-hero-feature-strip" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...brandTransitions.base, delay: 0.14 }} viewport={inViewOnce}>
          <div className="brand-hero-features">
            <div className="brand-hero-feature">
              <Target size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
              <div>
                <strong>ACCURACY AWARE</strong>
                <span>Confidence-scored interpolations</span>
              </div>
            </div>
            <div className="brand-hero-feature">
              <ShieldCheck size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
              <div>
                <strong>RELIABLE &amp; TRANSPARENT</strong>
                <span>Every frame validated. Uncertainty shown.</span>
              </div>
            </div>
            <div className="brand-hero-feature">
              <Users size={18} strokeWidth={1.8} className="brand-hero-feat-icon" />
              <div>
                <strong>BUILT FOR SCALE</strong>
                <span>Queue-managed access. Stable performance.</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <div className="brand-hero-right">
        <div className="brand-hero-visual-shell">
          <img
            src="/hero%20section.png"
            alt="AetherGIS temporal intelligence visual"
            draggable={false}
          />
        </div>

        <div className="brand-hero-right-meta">
          <motion.div className="brand-hero-trusted" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...brandTransitions.base, delay: 0.2 }} viewport={inViewOnce}>
            <div className="brand-hero-trusted-title">TRUSTED BY DATA. DESIGNED FOR INSIGHT.</div>
            <div className="brand-hero-logo-grid">
              <div className="brand-hero-logo-item">
                <img src="/landing/logos-landing/nasa-6.svg" alt="NASA" />
                <div>
                  <strong>NASA</strong>
                  <span>GIBS</span>
                </div>
              </div>
              <div className="brand-hero-logo-item">
                <img src="/landing/logos-landing/isro.svg" alt="ISRO" />
                <div>
                  <strong>ISRO</strong>
                  <span>Space Agency</span>
                </div>
              </div>
              <div className="brand-hero-logo-item">
                <img src="/landing/logos-landing/isro.svg" alt="ISRO Bhuvan" />
                <div>
                  <strong>ISRO</strong>
                  <span>Bhuvan</span>
                </div>
              </div>
              <div className="brand-hero-logo-item">
                <img src="/landing/logos-landing/isro.svg" alt="MOSDAC" />
                <div>
                  <strong>ISRO</strong>
                  <span>MOSDAC</span>
                </div>
              </div>
            </div>
          </motion.div>
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
