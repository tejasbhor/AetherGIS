import React from "react";
import { motion } from "motion/react";
import { brandTransitions, fadeUpVariants, inViewOnce } from "@brand/motion";
import { 
  User, 
  Users, 
  Clock, 
  ShieldCheck, 
  Lock, 
  CheckCircle,
  Database,
  LayoutList,
  Globe
} from "lucide-react";
import "./AccessModelSection.css";

const AccessModelSection: React.FC = () => {
  const itemVariants = fadeUpVariants;

  return (
    <section className="brand-section access-model-section">
      <div className="access-container">
        <div className="access-grid">
          
          {/* LEFT: Narrative */}
          <div className="access-narrative">
            <motion.div className="brand-hero-tag" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              <span className="brand-hero-tag-dot" />
              ACCESS MODEL
            </motion.div>

            <motion.h1 className="access-title" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              Engineered for
              <br />
              <span className="access-title-gradient">performance and stability.</span>
            </motion.h1>

            <motion.p className="access-description" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              AetherGIS uses a controlled access model to ensure 
              consistent system performance and resource availability.
            </motion.p>

            <div className="access-features-list">
              {[
                { icon: <User size={18} />, title: "One active compute session at a time", desc: "Ensures maximum GPU availability and prevents resource contention." },
                { icon: <LayoutList size={18} />, title: "Queue-based user access", desc: "Users are placed in a secure queue and granted access in order." },
                { icon: <Clock size={18} />, title: "Dedicated processing window per session", desc: "Each session gets a fixed time window for uninterrupted processing." }
              ].map((item, idx) => (
                <motion.div className="access-feature-item" key={idx} initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: idx * 0.08 }}>
                  <div className="access-feature-icon">{item.icon}</div>
                  <div className="access-feature-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div className="access-summary-box" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              <div className="summary-icon-box"><ShieldCheck size={20} /></div>
              <p>
                This approach prevents resource contention, ensures <span className="highlight-cyan">reliable AI inference</span>, and delivers stable results for every user.
              </p>
            </motion.div>
          </div>

          {/* RIGHT: System Visualization */}
          <div className="access-visualization">
            
            <motion.div className="how-it-works-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={brandTransitions.slow} viewport={inViewOnce}>
              <h4 className="works-title">HOW IT WORKS</h4>
              
              <div className="works-flow">
                {/* User Queue */}
                <div className="works-queue">
                  <span className="flow-label">USER QUEUE</span>
                  <div className="queue-list">
                    {[1, 2, 3].map(i => (
                      <div className="queue-item" key={i}>
                        <div className="queue-avatar"><User size={14} /></div>
                        <div className="queue-info">
                          <strong>User #{i}</strong>
                          <span>In Queue</span>
                        </div>
                        <Clock size={12} className="queue-clock" />
                      </div>
                    ))}
                    <div className="queue-dots">...</div>
                    <div className="queue-item">
                      <div className="queue-avatar"><User size={14} /></div>
                      <div className="queue-info">
                        <strong>User #N</strong>
                        <span>In Queue</span>
                      </div>
                      <Clock size={12} className="queue-clock" />
                    </div>
                  </div>
                </div>

                {/* Flow Arrow 1 */}
                <div className="flow-connector">
                  <svg width="40" height="2" viewBox="0 0 40 2" fill="none">
                    <line x1="0" y1="1" x2="40" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>

                {/* Active Session */}
                <div className="active-session-card">
                  <span className="flow-label">ACTIVE SESSION</span>
                  <div className="session-main">
                    <div className="session-avatar-ring">
                      <div className="session-avatar"><User size={32} /></div>
                      <svg viewBox="0 0 100 100" className="session-ring">
                        <circle cx="50" cy="50" r="48" className="ring-bg" />
                        <motion.circle cx="50" cy="50" r="48" className="ring-fill" initial={{ pathLength: 0 }} whileInView={{ pathLength: 0.72 }} transition={brandTransitions.slow} />
                      </svg>
                    </div>
                    <div className="session-user-info">
                      <strong>User #1</strong>
                      <span className="active-badge">ACTIVE</span>
                    </div>
                  </div>
                  <div className="session-progress">
                    <div className="progress-header">
                      <span>PROCESSING</span>
                      <strong>72%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <motion.div className="progress-bar-fill" initial={{ width: 0 }} whileInView={{ width: "72%" }} transition={brandTransitions.slow} />
                    </div>
                    <div className="session-eta">
                      <span>Estimated time remaining</span>
                      <strong>00:18:42</strong>
                    </div>
                  </div>
                </div>

                {/* Flow Arrow 2 & End Column */}
                <div className="works-outputs">
                  <div className="output-step completed">
                    <span className="flow-label">COMPLETED</span>
                    <div className="completed-box">
                      <div className="check-icon"><CheckCircle size={20} /></div>
                      <strong>Session Complete</strong>
                      <span>Results Generated</span>
                    </div>
                  </div>
                  
                  <div className="output-step next-in">
                    <span className="flow-label">NEXT IN QUEUE</span>
                    <div className="next-box">
                      <User size={16} className="next-user-icon" />
                      <div>
                        <strong>User #2</strong>
                        <span>Up Next</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom Feature Cards */}
            <div className="access-metrics-grid">
              {[
                { icon: <ShieldCheck size={20} />, label: "Resource Isolation", value: "100%", desc: "No shared compute during sessions", color: "blue" },
                { icon: <Clock size={20} />, label: "Performance", value: "Stable", desc: "Consistent inference speed", color: "purple" },
                { icon: <Users size={20} />, label: "Access", value: "Fair", desc: "Everyone gets equal opportunity", color: "cyan" },
                { icon: <Lock size={20} />, label: "Environment", value: "Secure", desc: "Sessions are isolated and monitored", color: "green" }
              ].map((card, idx) => (
                <motion.div className={`metric-card ${card.color}`} key={idx} initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce} transition={{ ...brandTransitions.base, delay: 0.1 * idx }}>
                  <div className="metric-header">
                    <div className="metric-icon">{card.icon}</div>
                    <div className="metric-text">
                      <strong>{card.value}</strong>
                      <span>{card.label}</span>
                    </div>
                  </div>
                  <p className="metric-desc">{card.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div className="access-final-banner" initial="hidden" whileInView="visible" variants={itemVariants} viewport={inViewOnce}>
              <div className="banner-left">
                <Database size={20} className="banner-db-icon" />
                <p>Controlled access. Maximum performance. Reliable results.</p>
              </div>
              <div className="banner-right">
                <div className="banner-logo">
                  <Globe size={18} />
                  <span>AetherGIS</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AccessModelSection;
