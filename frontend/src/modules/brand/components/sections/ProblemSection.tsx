import React from "react";
import { motion } from "motion/react";
import { Info, Clock, Layers, HelpCircle, BarChart3, Target } from "lucide-react";
import { brandTransitions, fadeUpVariants, inViewOnce, staggerContainerVariants } from "@brand/motion";
import "./ProblemSection.css";

const ProblemSection: React.FC = () => {
  const containerVariants = staggerContainerVariants;
  const itemVariants = fadeUpVariants;

  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: brandTransitions.base.ease }
    }
  };

  return (
    <section className="brand-section problem-section">
      <motion.div 
        className="problem-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={inViewOnce}
      >
        <div className="problem-content-grid">
          {/* LEFT COLUMN: Narrative */}
          <div className="problem-narrative">
            <motion.div className="brand-hero-tag" variants={itemVariants}>
              <span className="brand-hero-tag-dot" />
              THE PROBLEM
            </motion.div>

            <motion.h1 className="problem-display-title" variants={itemVariants}>
              Satellite data shows
              <br />
              <span className="problem-title-gradient">moments — not motion.</span>
            </motion.h1>

            <motion.p className="problem-lead-text" variants={itemVariants}>
              Most satellite systems capture Earth at fixed time intervals.
              Between those frames, critical motion is lost — making it
              difficult to understand how environmental
              events actually evolve.
            </motion.p>

            <motion.div className="problem-result-pill" variants={itemVariants}>
              <div className="result-pill-icon">
                <Info size={18} />
              </div>
              <p className="result-pill-content">
                The result: <span className="highlight-blue">fragmented understanding</span>, higher uncertainty,
                and <span className="highlight-blue">limited ability</span> to interpret change with confidence.
              </p>
            </motion.div>

            <motion.div className="visual-solution-pill" variants={itemVariants}>
              <div className="solution-pill-icon">
                <Target size={24} />
              </div>
              <p className="solution-pill-text">
                AetherGIS is built to close this gap — transforming 
                disconnected snapshots into <span className="highlight-cyan">continuous, interpretable motion.</span>
              </p>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Visual Diagram */}
          <div className="problem-visualization">
            <motion.div className="visual-stage-card" variants={itemVariants}>
              <h4 className="visual-stage-label">The Gap Between Observations</h4>
              
              <div className="visual-sequence">
                {/* Frame 1 */}
                <div className="sequence-frame">
                  <span className="sequence-timestamp">10:30 AM</span>
                  <div className="sequence-image-holder">
                    <img src="/satellite_hurricane_frame_1.png" alt="T0" />
                    <div className="sequence-image-overlay" />
                  </div>
                </div>

                {/* Connector 1 */}
                <div className="sequence-connector">
                  <svg width="40" height="2" viewBox="0 0 40 2" fill="none">
                    <motion.path 
                      d="M0 1H38" 
                      stroke="#3b82f6" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4" 
                      variants={drawLine}
                    />
                    <circle cx="39" cy="1" r="1" fill="#3b82f6" />
                  </svg>
                </div>

                {/* Gap Frame */}
                <div className="sequence-frame gap-item">
                  <span className="sequence-timestamp">GAP (2 HOURS)</span>
                  <div className="sequence-gap-placeholder">
                    <div className="gap-grid-bg" />
                    <HelpCircle size={32} className="gap-icon" />
                    <p>What happened<br /><span>in between?</span></p>
                  </div>
                </div>

                {/* Connector 2 */}
                <div className="sequence-connector">
                  <svg width="40" height="2" viewBox="0 0 40 2" fill="none">
                    <motion.path 
                      d="M0 1H38" 
                      stroke="#3b82f6" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4" 
                      variants={drawLine}
                    />
                    <circle cx="39" cy="1" r="1" fill="#3b82f6" />
                  </svg>
                </div>

                {/* Frame 2 */}
                <div className="sequence-frame">
                  <span className="sequence-timestamp">12:30 PM</span>
                  <div className="sequence-image-holder">
                    <img src="/satellite_hurricane_frame_2.png" alt="T1" />
                    <div className="sequence-image-overlay" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="problem-challenges-card" variants={itemVariants}>
              <h3 className="challenges-eyebrow">KEY CHALLENGES</h3>
              
              <div className="problem-challenges-grid">
                {[
                  { icon: <Clock size={18} />, title: "Temporal Gaps", desc: "Large intervals hide rapid changes." },
                  { icon: <Layers size={18} />, title: "Discontinuous", desc: "Events appear as disconnected snapshots." },
                  { icon: <HelpCircle size={18} />, title: "Uncertainty", desc: "Analysts must guess what happened." },
                  { icon: <BarChart3 size={18} />, title: "Decision Delay", desc: "Incomplete info leads to slower actions." }
                ].map((item, idx) => (
                  <div className="challenge-grid-item" key={idx}>
                    <div className="challenge-grid-icon">
                      {item.icon}
                    </div>
                    <div className="challenge-grid-body">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ProblemSection;
