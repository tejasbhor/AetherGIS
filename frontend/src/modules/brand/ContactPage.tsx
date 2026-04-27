import React, { useState } from 'react';
import BrandPageShell from './components/BrandPageShell';
import './Brand.css';

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <BrandPageShell contentClassName="brand-contact-layout">

      {/* ── Hero ── */}
      <header className="brand-contact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Get in Touch</h1>
        <p className="brand-contact-hero-sub">
          Questions about the platform, collaboration requests, research partnerships, or feedback.
          We read every message.
        </p>
      </header>

      <div className="brand-contact-grid">

        {/* ── Form ── */}
        <section className="brand-contact-form-card">
          {submitted ? (
            <div className="brand-contact-success">
              <div className="brand-contact-success-icon">✓</div>
              <h2>Message Received</h2>
              <p>Thank you for reaching out. We'll get back to you within 2–3 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="brand-contact-form">
              <h2>Send a Message</h2>

              <div className="brand-contact-row">
                <div className="brand-contact-field">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="brand-contact-field">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="brand-contact-field">
                <label htmlFor="contact-subject">Subject</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select a topic…</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Research Collaboration">Research Collaboration</option>
                  <option value="Platform Access">Platform Access Request</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Data Sources">Data Sources & Coverage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="brand-contact-field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  placeholder="Describe your inquiry in detail…"
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="brand-btn brand-btn-primary brand-contact-submit">
                Send Message
              </button>
            </form>
          )}
        </section>

        {/* ── Contact info ── */}
        <aside className="brand-contact-aside">
          <section className="brand-contact-info-card">
            <h3>Direct Contact</h3>
            <div className="brand-contact-info-item">
              <span className="brand-contact-info-icon">✉</span>
              <div>
                <p className="brand-contact-info-label">General</p>
                <a href="mailto:support@aethergis.ai" className="brand-contact-info-link">support@aethergis.ai</a>
              </div>
            </div>
            <div className="brand-contact-info-item">
              <span className="brand-contact-info-icon">⊕</span>
              <div>
                <p className="brand-contact-info-label">Research & Partnerships</p>
                <a href="mailto:research@aethergis.ai" className="brand-contact-info-link">research@aethergis.ai</a>
              </div>
            </div>
          </section>

          <section className="brand-contact-info-card">
            <h3>Response Times</h3>
            {[
              { label: 'General Inquiries',     time: '2–3 business days' },
              { label: 'Research Partnerships', time: '3–5 business days' },
              { label: 'Access Requests',       time: '1–2 business days' },
              { label: 'Technical Support',     time: '24–48 hours' },
            ].map(({ label, time }) => (
              <div key={label} className="brand-contact-response-row">
                <span className="brand-contact-response-label">{label}</span>
                <span className="brand-contact-response-time">{time}</span>
              </div>
            ))}
          </section>

          <section className="brand-contact-info-card brand-contact-disclaimer">
            <h3>Platform Disclaimer</h3>
            <p>
              AetherGIS outputs are synthetic approximations for qualitative analysis only.
              Not suitable for scientific measurement or forecasting.
            </p>
          </section>
        </aside>

      </div>
    </BrandPageShell>
  );
};

export default ContactPage;
