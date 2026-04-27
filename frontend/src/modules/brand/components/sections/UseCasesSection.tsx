import React from "react";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Microscope, 
  Newspaper, 
  BarChart3, 
  Target,
  ArrowRight
} from "lucide-react";
import "./UseCasesSection.css";

const UseCasesSection: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <section className="brand-section use-cases-section">
      <div className="cases-container">
        
        {/* Top Section: Narrative + Sequence Grid */}
        <div className="cases-top-grid">
          <div className="cases-header">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <span className="brand-hero-tag-dot" />
              USE CASES
            </motion.div>

            <motion.h1 className="cases-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Designed for
              <br />
              <span className="cases-title-gradient">understanding dynamic Earth systems.</span>
            </motion.h1>

            <motion.p className="cases-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              AetherGIS is built for users who need clearer 
              interpretation of environmental change.
            </motion.p>
          </div>

          <motion.div 
            className="sequence-visual-box"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <div className="sequence-stage">
              <span className="stage-label">OBSERVED</span>
              <div className="stage-frame real">
                <div className="frame-placeholder hurricane-small" />
              </div>
            </div>

            <div className="sequence-connector">
              <ArrowRight size={14} />
            </div>

            <div className="sequence-stage ai-stage">
              <div className="ai-frames-row">
                {[1, 2, 3].map(i => (
                  <div className="stage-frame ai" key={i}>
                    <div className={`frame-placeholder hurricane-small-blur-${i}`} />
                  </div>
                ))}
              </div>
              <span className="stage-label-ai">AI RECONSTRUCTION</span>
            </div>

            <div className="sequence-connector">
              <ArrowRight size={14} />
            </div>

            <div className="sequence-stage">
              <span className="stage-label">OBSERVED</span>
              <div className="stage-frame real">
                <div className="frame-placeholder hurricane-small-final" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Cards Grid */}
        <div className="cases-grid">
          
          {/* 1. Students & Educators */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><GraduationCap size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Students & Educators</span>
                <span className="case-subtitle-small">Visualize atmospheric processes with clarity.</span>
              </div>
            </div>
            <div className="case-card-visual split-view">
              <div className="split-left" />
              <div className="split-right" />
              <div className="split-divider">
                <div className="divider-handle">
                  <span>&lt;&gt;</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Researchers */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><Microscope size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Researchers</span>
                <span className="case-subtitle-small">Explore temporal patterns in satellite data.</span>
              </div>
            </div>
            <div className="case-card-visual chart-view">
              <div className="chart-header">Cloud Coverage (%)</div>
              <svg viewBox="0 0 200 100" className="mini-chart">
                <path d="M0 80 Q 25 20, 50 60 T 100 40 T 150 70 T 200 30" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="100" cy="40" r="3" fill="#fff" />
                <rect x="105" y="45" width="60" height="30" rx="4" className="chart-tooltip-bg" />
                <text x="110" y="58" className="tooltip-title">Significant</text>
                <text x="110" y="70" className="tooltip-sub">Change Detected</text>
              </svg>
            </div>
          </motion.div>

          {/* 3. Journalists */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><Newspaper size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Journalists</span>
                <span className="case-subtitle-small">Communicate environmental events effectively.</span>
              </div>
            </div>
            <div className="case-card-visual zoom-view">
              <div className="hurricane-zoom" />
              <div className="zoom-label">
                <strong>Cyclone Formation</strong>
                <span>Over Bay of Bengal</span>
              </div>
            </div>
          </motion.div>

          {/* 4. Analysts */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><BarChart3 size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Analysts</span>
                <span className="case-subtitle-small">Enhance situational awareness.</span>
              </div>
            </div>
            <div className="case-card-visual map-view">
              <div className="map-placeholder-india" />
              <div className="heatmap-overlay" />
            </div>
          </motion.div>

        </div>

        {/* Bottom Mission Banner */}
        <motion.div 
          className="cases-mission-banner"
          initial="hidden"
          whileInView="visible"
          variants={itemVariants}
          viewport={{ once: true }}
        >
          <div className="mission-icon"><Target size={24} /></div>
          <p>
            The platform focuses on <span className="highlight-cyan">interpretability</span>, not prediction.
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default UseCasesSection;
