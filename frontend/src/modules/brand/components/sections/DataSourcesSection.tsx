import React from "react";
import { motion } from "motion/react";
import { Cloud, Database, Info, Globe, Cpu, Radio } from "lucide-react";
import "./DataSourcesSection.css";

const DataSourcesSection: React.FC = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <section className="brand-section data-sources-section">
      <div className="sources-container">
        <div className="sources-content-grid">
          
          {/* Left Column: Narrative + Visual */}
          <div className="sources-left">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              <span className="brand-hero-tag-dot" />
              DATA SOURCES
            </motion.div>

            <motion.h1 className="sources-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              Built on
              <br />
              <span className="sources-title-gradient">trusted satellite data.</span>
            </motion.h1>

            <motion.p className="sources-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={{ once: true }}>
              AetherGIS integrates with globally recognized 
              satellite data sources.
            </motion.p>

            <motion.div 
              className="sources-tech-specs"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="tech-spec-item">
                <span className="spec-label">RESOLUTION</span>
                <span className="spec-value">Up to 250m</span>
              </div>
              <div className="tech-spec-item">
                <span className="spec-label">SPECTRA</span>
                <span className="spec-value">12+ Bands</span>
              </div>
              <div className="tech-spec-item">
                <span className="spec-label">LATENCY</span>
                <span className="spec-value">&lt; 3 Hours</span>
              </div>
              <div className="tech-spec-item">
                <span className="spec-label">PROTOCOL</span>
                <span className="spec-value">OGC WMTS</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Source Cards */}
          <div className="sources-right">
            
            {/* Cloud Deployment Section */}
            <div className="source-group">
              <div className="group-header">
                <Cloud size={16} className="group-icon-blue" />
                <span>CLOUD DEPLOYMENT</span>
              </div>
              
              <motion.div 
                className="source-card primary-card"
                initial="hidden"
                whileInView="visible"
                variants={itemVariants}
                viewport={{ once: true }}
              >
                <div className="card-main-content">
                  <div className="logo-box nasa-logo">
                    <Globe size={32} />
                  </div>
                  <div className="source-info">
                    <h3>NASA GIBS</h3>
                    <p className="source-subtitle">Global Imagery Browse Services</p>
                    <div className="source-divider" />
                    <span className="badge badge-primary">PRIMARY DATA SOURCE</span>
                    <p className="source-text">
                      Provides global, near real-time satellite imagery 
                      across multiple spectral bands and resolutions.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Local / Extended Pipelines Section */}
            <div className="source-group">
              <div className="group-header">
                <Database size={16} className="group-icon-purple" />
                <span>LOCAL / EXTENDED PIPELINES</span>
              </div>

              <div className="group-cards-row">
                <motion.div 
                  className="source-card compact-card"
                  initial="hidden"
                  whileInView="visible"
                  variants={itemVariants}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="logo-box mosdac-logo">
                    <Cpu size={24} />
                  </div>
                  <div className="source-info">
                    <h3>MOSDAC</h3>
                    <p className="source-subtitle">Meteorological Data</p>
                    <span className="badge badge-purple">LOCAL EXECUTION</span>
                    <p className="source-text">
                      High-resolution meteorological datasets for advanced analysis.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="source-card compact-card"
                  initial="hidden"
                  whileInView="visible"
                  variants={itemVariants}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="logo-box isro-logo">
                    <Radio size={24} />
                  </div>
                  <div className="source-info">
                    <h3>ISRO Bhuvan</h3>
                    <p className="source-subtitle">Planned Integration</p>
                    <span className="badge badge-ghost">FUTURE SCOPE</span>
                    <p className="source-text">
                      Planned integration to enable broader access to datasets.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div 
              className="sources-footer-pill"
              initial="hidden"
              whileInView="visible"
              variants={itemVariants}
              viewport={{ once: true }}
            >
              <Info size={18} className="footer-pill-icon" />
              <p>
                Due to API availability constraints, cloud deployment currently supports <span className="text-highlight-blue">NASA GIBS</span> exclusively.
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DataSourcesSection;
