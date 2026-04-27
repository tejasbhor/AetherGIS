import React from "react";
import { motion } from "framer-motion";
import { Globe, Calendar, BrainCircuit, Play, Columns, Target } from "lucide-react";
import "./SystemSection.css";

const SystemSection: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <section className="brand-section system-section">
      <div className="system-container">
        <div className="system-content-grid">
          {/* Left Column: Features */}
          <div className="system-narrative">
            <motion.div 
              className="brand-hero-tag"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="brand-hero-tag-dot" />
              SYSTEM EXPERIENCE
            </motion.div>

            <motion.h1 
              className="system-title"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
            >
              A complete WebGIS
              <br />
              <span className="system-title-gradient">environment for temporal analysis.</span>
            </motion.h1>

            <motion.p 
              className="system-description"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
            >
              AetherGIS provides an integrated interface designed for real-world 
              exploration and analysis of satellite data.
            </motion.p>

            <div className="system-features-list">
              {[
                { icon: <Globe size={20} />, title: "Select geographic region and satellite layer", desc: "Browse global datasets and choose the area that matters." },
                { icon: <Calendar size={20} />, title: "Define time range and resolution", desc: "Set custom time intervals and resolution for precise analysis." },
                { icon: <BrainCircuit size={20} />, title: "Execute AI-powered interpolation pipeline", desc: "Generate intermediate frames using advanced AI models with accuracy validation." },
                { icon: <Play size={20} />, title: "Visualize results through interactive timelines", desc: "Explore temporal evolution with smooth playback and frame-level controls." },
                { icon: <Columns size={20} />, title: "Compare original and generated frames side-by-side", desc: "Evaluate changes clearly with synchronized comparison views." }
              ].map((feature, idx) => (
                <motion.div 
                  className="system-feature-item" 
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  variants={itemVariants}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="system-feature-icon">
                    {feature.icon}
                  </div>
                  <div className="system-feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="system-bottom-pill"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
            >
              <div className="bottom-pill-icon">
                <Target size={20} />
              </div>
              <p>
                The system is built to deliver <span className="highlight-blue">clarity</span>, <span className="highlight-blue">control</span>, 
                and <span className="highlight-blue">insight</span> at every stage of the workflow.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Dashboard Visual */}
          <motion.div 
            className="system-visualization"
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <div className="dashboard-mock-container">
              <div className="dashboard-mock-header">
                <div className="mock-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="mock-address-bar">aether-gis.app/dashboard</div>
              </div>
              <div className="dashboard-mock-image">
                <img src="/landing/hero-dashboard.webp" alt="AetherGIS Dashboard Interface" />
                <div className="mock-scanline" />
              </div>
              <div className="dashboard-mock-glow" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SystemSection;
