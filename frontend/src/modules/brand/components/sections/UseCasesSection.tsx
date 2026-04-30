import React from "react";
import { motion } from "motion/react";
import { brandTransitions, fadeUpVariants, inViewOnce } from "@brand/motion";
import { 
  GraduationCap, 
  Microscope, 
  Newspaper, 
  BarChart3, 
  Target
} from "lucide-react";
import "./UseCasesSection.css";

const UseCasesSection: React.FC = () => {
  const itemVariants = fadeUpVariants;

  return (
    <section className="brand-section use-cases-section">
      <div className="cases-container">
        
        {/* Top Section: Narrative + Sequence Grid */}
        <div className="cases-top-grid">
          <div className="cases-header">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              <span className="brand-hero-tag-dot" />
              USE CASES
            </motion.div>

            <motion.h1 className="cases-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              Designed for
              <br />
              <span className="cases-title-gradient">understanding dynamic Earth systems.</span>
            </motion.h1>

            <motion.p className="cases-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              AetherGIS is built for users who need clearer 
              interpretation of environmental change.
            </motion.p>
          </div>

          <motion.div 
            className="sequence-visual-box"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={brandTransitions.slow}
            viewport={inViewOnce}
          >
            <div className="sequence-stage">
              <span className="stage-label">OBSERVED</span>
              <div className="stage-frame real">
                <img className="stage-seq-img" src="/landing/satellite_hurricane_frame_1.png" alt="Observed frame" loading="lazy" />
              </div>
            </div>

            <div className="sequence-connector">
              <span>•</span>
            </div>

            <div className="sequence-stage ai-stage">
              <div className="ai-frames-row">
                {[1, 2, 3].map(i => (
                  <div className="stage-frame ai" key={i}>
                    <img className={`stage-seq-img stage-seq-ai-${i}`} src="/landing/satellite_hurricane_frame_1.png" alt="AI reconstruction" loading="lazy" />
                  </div>
                ))}
              </div>
              <span className="stage-label-ai">AI RECONSTRUCTION</span>
            </div>

            <div className="sequence-connector">
              <span>•</span>
            </div>

            <div className="sequence-stage">
              <span className="stage-label">OBSERVED</span>
              <div className="stage-frame real">
                <img className="stage-seq-img" src="/landing/satellite_hurricane_frame_2.png" alt="Observed frame" loading="lazy" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Cards Grid */}
        <div className="cases-grid">
          
          {/* 1. Students & Educators */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: 0.1 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><GraduationCap size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Students & Educators</span>
                <span className="case-subtitle-small">Visualize atmospheric processes with clarity.</span>
              </div>
            </div>
            <div className="case-card-visual image-view">
              <img className="case-media" src="/landing/use-case-section%20eduction.jpeg" alt="Education use case" loading="lazy" />
            </div>
          </motion.div>

          {/* 2. Researchers */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: 0.2 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><Microscope size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Researchers</span>
                <span className="case-subtitle-small">Explore temporal patterns in satellite data.</span>
              </div>
            </div>
            <div className="case-card-visual image-view">
              <img className="case-media" src="/landing/use-case-section%20research.jpeg" alt="Research use case" loading="lazy" />
            </div>
          </motion.div>

          {/* 3. Journalists */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: 0.3 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><Newspaper size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Journalists</span>
                <span className="case-subtitle-small">Communicate environmental events effectively.</span>
              </div>
            </div>
            <div className="case-card-visual image-view">
              <img className="case-media" src="/landing/use-case-section%20journalist.jpeg" alt="Journalism use case" loading="lazy" />
            </div>
          </motion.div>

          {/* 4. Analysts */}
          <motion.div className="case-card" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: 0.4 }}>
            <div className="case-card-header">
              <div className="case-icon-box"><BarChart3 size={18} /></div>
              <div className="case-text-row">
                <span className="case-title-small">Analysts</span>
                <span className="case-subtitle-small">Enhance situational awareness.</span>
              </div>
            </div>
            <div className="case-card-visual image-view">
              <img className="case-media" src="/landing/use-case-section%20Analysis.jpeg" alt="Analysis use case" loading="lazy" />
            </div>
          </motion.div>

        </div>

        {/* Bottom Mission Banner */}
        <motion.div 
          className="cases-mission-banner"
          initial="hidden"
          whileInView="visible"
          variants={itemVariants}
          viewport={inViewOnce}
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
