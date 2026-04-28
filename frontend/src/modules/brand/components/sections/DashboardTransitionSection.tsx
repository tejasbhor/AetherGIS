import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Globe,
  Activity,
  Rocket
} from "lucide-react";
import "./DashboardTransitionSection.css";

const DashboardTransitionSection: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <section className="brand-section transition-section">
      <div className="transition-container">
        
        {/* Main Content Grid */}
        <div className="transition-main-grid">
          
          {/* Left Column: CTA Narrative */}
          <div className="transition-cta-column">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <Rocket size={14} className="tag-icon-blue" />
              GET STARTED
            </motion.div>

            <motion.h1 className="transition-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Experience
              <br />
              <span className="transition-title-gradient">AetherGIS.</span>
            </motion.h1>

            <motion.p className="transition-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Explore how AI can transform the way 
              you interpret satellite imagery.
            </motion.p>

            <motion.div 
              className="access-note-box"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="access-icon-box"><ShieldCheck size={20} /></div>
              <p>
                Access is limited to ensure 
                <span className="text-white"> performance</span> and <span className="text-white">reliability</span>.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/access" className="brand-btn brand-btn-primary brand-btn-lg transition-cta-button">
                <span>Request Platform Access</span>
                <ArrowRight size={20} className="arrow-icon" />
              </Link>
            </motion.div>

            <motion.div 
              className="security-footer-note"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Lock size={14} />
              <span>Secure access. Controlled sessions. Maximum performance.</span>
            </motion.div>
          </div>

          {/* Right Column: 3D Dashboard Preview */}
          <motion.div 
            className="dashboard-perspective-container"
            initial={{ opacity: 0, x: 100, rotateY: 10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -15 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <div className="dashboard-frame">
              <img 
                src="/landing/hero-dashboard.webp" 
                alt="AetherGIS Dashboard" 
                className="dashboard-image-final"
              />
              <div className="dashboard-overlay-glow" />
            </div>
          </motion.div>

        </div>

        {/* Bottom Feature Pillar Row */}
        <div className="pillar-row-container">
          <motion.div 
            className="pillars-grid"
            initial="hidden"
            whileInView="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            viewport={{ once: true }}
          >
            {[
              { icon: <Cpu />, title: "AI-Powered", sub: "Interpolation" },
              { icon: <Activity />, title: "Accuracy-Aware", sub: "Validation" },
              { icon: <Database />, title: "Trusted Satellite", sub: "Data Sources" },
              { icon: <ShieldCheck />, title: "Controlled Access", sub: "for Stability" },
              { icon: <Globe />, title: "WebGIS Native", sub: "Experience" }
            ].map((pillar, idx) => (
              <motion.div className="pillar-item" key={idx} variants={itemVariants}>
                <div className="pillar-icon-box">{pillar.icon}</div>
                <div className="pillar-text">
                  <strong>{pillar.title}</strong>
                  <span>{pillar.sub}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default DashboardTransitionSection;
