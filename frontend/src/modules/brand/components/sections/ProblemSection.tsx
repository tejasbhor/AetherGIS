import React from "react";
import { motion } from "framer-motion";
import { Info, Clock, Layers, HelpCircle, BarChart3, Target, ChevronDown } from "lucide-react";
import "./ProblemSection.css";

const ProblemSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  return (
    <section className="brand-section problem-section">
      <motion.div 
        className="problem-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
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

            <div className="problem-challenges-stack">
              <motion.h3 className="challenges-eyebrow" variants={itemVariants}>KEY CHALLENGES</motion.h3>
              
              {[
                { icon: <Clock size={20} />, title: "Temporal Gaps", desc: "Large intervals between observations hide rapid changes." },
                { icon: <Layers size={20} />, title: "Discontinuous Narratives", desc: "Environmental events appear as disconnected snapshots." },
                { icon: <HelpCircle size={20} />, title: "Interpretation Uncertainty", desc: "Analysts must guess what happened between frames." },
                { icon: <BarChart3 size={20} />, title: "Limited Decision Support", desc: "Incomplete information leads to slower, less confident actions." }
              ].map((item, idx) => (
                <motion.div className="challenge-card" key={idx} variants={itemVariants}>
                  <div className="challenge-card-icon">
                    {item.icon}
                  </div>
                  <div className="challenge-card-body">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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

            <motion.div className="visual-down-indicator" variants={itemVariants}>
              <ChevronDown size={32} strokeWidth={1.5} />
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
        </div>
      </motion.div>
    </section>
  );
};

export default ProblemSection;
