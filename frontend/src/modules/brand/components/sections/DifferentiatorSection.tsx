import React from "react";
import { motion } from "motion/react";
import { 
  Zap, 
  Clock, 
  Grid, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Target
} from "lucide-react";
import "./DifferentiatorSection.css";

const DifferentiatorSection: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <section className="brand-section differentiator-section">
      <div className="differentiator-container">
        <div className="differentiator-grid">
          
          {/* LEFT: Narrative */}
          <div className="diff-narrative">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <span className="brand-hero-tag-dot" />
              CORE DIFFERENTIATOR
            </motion.div>

            <motion.h1 className="diff-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Not just interpolation.
              <br />
              <span className="diff-title-gradient">Controlled interpolation.</span>
            </motion.h1>

            <motion.p className="diff-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Unlike conventional approaches, AetherGIS does not treat all generated 
              frames as equally reliable. Every interpolated frame undergoes a 
              <span className="text-highlight-blue"> multi-layer validation process</span> before being presented.
            </motion.p>

            <div className="diff-features-list">
              {[
                { icon: <Zap size={18} />, title: "Optical flow consistency validation", desc: "Ensures motion continuity is physically plausible." },
                { icon: <Clock size={18} />, title: "Temporal gap-aware constraints", desc: "Adapts to variable time gaps and revisit cycles." },
                { icon: <Grid size={18} />, title: "Pixel-level difference analysis", desc: "Compares generated frames against adjacent observations." },
                { icon: <ShieldCheck size={18} />, title: "Confidence scoring and classification", desc: "Each frame is scored and classified based on metrics." }
              ].map((item, idx) => (
                <motion.div className="diff-feature-item" key={idx} initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <div className="diff-feature-icon">{item.icon}</div>
                  <div className="diff-feature-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div className="diff-summary-box" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <p>
                Frames are categorized as <span className="conf-high">High</span>, <span className="conf-med">Medium</span>, or <span className="conf-low">Low</span> confidence — ensuring that users can distinguish 
                between reliable approximations and uncertain outputs.
              </p>
            </motion.div>
          </div>

          {/* RIGHT: Pipeline Diagram */}
          <div className="diff-visualization">
            <motion.div className="pipeline-card" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
              <h4 className="pipeline-title">Our Validation Pipeline</h4>
              
              <div className="pipeline-flow">
                {/* Inputs */}
                <div className="pipeline-inputs">
                  <span className="flow-label">INPUT OBSERVATIONS</span>
                  <div className="input-stack">
                    <img src="/satellite_hurricane_frame_1.png" alt="In 1" />
                    <img src="/satellite_hurricane_frame_2.png" alt="In 2" />
                    <div className="stack-more">...</div>
                  </div>
                </div>

                <ArrowRight size={20} className="flow-arrow" />

                {/* Validation Box */}
                <div className="validation-box">
                  <span className="flow-label">MULTI-LAYER VALIDATION</span>
                  <div className="validation-steps">
                    <div className="val-step">
                      <Zap size={14} />
                      <div className="val-visual optical-flow"></div>
                      <div className="val-status"><span className="dot-pass"></span> PASS</div>
                    </div>
                    <div className="val-step">
                      <Clock size={14} />
                      <div className="val-visual time-constraints"></div>
                      <div className="val-status"><span className="dot-pass"></span> PASS</div>
                    </div>
                    <div className="val-step">
                      <Grid size={14} />
                      <div className="val-visual pixel-diff"></div>
                      <div className="val-status"><span className="dot-pass"></span> PASS</div>
                    </div>
                    <div className="val-step">
                      <ShieldCheck size={14} />
                      <div className="val-visual gauge-box">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <motion.path className="circle" strokeDasharray="86, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
                          <text x="18" y="20.35" className="percentage">86%</text>
                        </svg>
                      </div>
                      <div className="val-status"><span className="dot-pass"></span> PASS</div>
                    </div>
                  </div>
                </div>

                <ArrowRight size={20} className="flow-arrow" />

                {/* Output */}
                <div className="pipeline-output">
                  <span className="flow-label">VALIDATED FRAME</span>
                  <div className="output-frame">
                    <img src="/satellite_hurricane_frame_1.png" alt="Out" />
                  </div>
                </div>
              </div>

              {/* Failure Path */}
              <div className="failure-path">
                <div className="fail-box">
                  <AlertTriangle size={18} color="#ef4444" />
                  <div>
                    <strong>LOW CONFIDENCE</strong>
                    <span>Frames flagged or excluded</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Confidence Levels */}
            <div className="confidence-levels-grid">
              <motion.div className="conf-card high" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
                <div className="conf-card-header">
                  <span className="dot-pass"></span> HIGH CONFIDENCE
                </div>
                <div className="conf-card-body">
                  <div className="conf-stats">
                    <strong>80-100%</strong>
                    <span>Reliable approximation</span>
                  </div>
                  <img src="/satellite_hurricane_frame_1.png" alt="High" className="conf-preview" />
                </div>
              </motion.div>

              <motion.div className="conf-card med" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <div className="conf-card-header">
                  <span className="dot-warn"></span> MEDIUM CONFIDENCE
                </div>
                <div className="conf-card-body">
                  <div className="conf-stats">
                    <strong>50-79%</strong>
                    <span>Moderate reliability</span>
                  </div>
                  <img src="/satellite_hurricane_frame_1.png" alt="Med" className="conf-preview med-filter" />
                </div>
              </motion.div>

              <motion.div className="conf-card low" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <div className="conf-card-header">
                  <span className="dot-fail"></span> LOW CONFIDENCE
                </div>
                <div className="conf-card-body">
                  <div className="conf-stats">
                    <strong>0-49%</strong>
                    <span>High uncertainty</span>
                  </div>
                  <img src="/satellite_hurricane_frame_1.png" alt="Low" className="conf-preview low-filter" />
                </div>
              </motion.div>
            </div>

            <motion.div className="diff-bottom-pill" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <div className="bottom-pill-icon"><Target size={20} /></div>
              <p>This accuracy-aware approach prioritizes <span className="highlight-cyan">transparency over visual smoothness.</span></p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DifferentiatorSection;
