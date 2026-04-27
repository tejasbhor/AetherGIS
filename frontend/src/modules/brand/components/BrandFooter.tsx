import React from 'react';
import { Link } from 'react-router-dom';

interface SocialLink {
  name: string;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  disabled?: boolean;
}

// SVG-based social media brand icons - crisp at any size, no external dependencies
const SocialIconGithub = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const SocialIconBrandX = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const SocialIconDiscord = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.01.06c1.8 1.32 3.53 2.12 5.24 2.65c.03.18.07.36.12.55c.05.19.09.38.15.57c.27.06.54.11.81.16c.06.02.12.03.18.05c.07.02.14.03.21.05c.45.09.9.16 1.35.2c.04.01.08.02.11.02c.72.1 1.44.18 2.16.18c.72 0 1.44-.08 2.16-.18c.04-.01.07-.02.11-.02c.45-.04.9-.11 1.35-.2c.07-.02.14-.03.21-.05c.06-.01.12-.03.18-.05c.27-.05.54-.1.81-.16c.05-.19.09-.38.14-.57c.06-.19.1-.37.12-.55c1.71-.53 3.44-1.33 5.24-2.65c0-.02.01-.04.01-.06c.38-3.92-.37-7.88-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
  </svg>
);

const SocialIconBluesky = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M13.53 10.625c1.548 0 2.81 1.262 2.81 2.812s-1.262 2.812-2.81 2.812-2.81-1.262-2.81-2.812 1.262-2.812 2.81-2.812zm6.376 7.617a.69.69 0 0 1-.446.182h-1.131v-2.938c0-2.428-2.41-3.642-5.426-3.642-3.016 0-5.426 1.214-5.426 3.642v2.938H3.275a.69.69 0 0 1-.446-.182.668.668 0 0 1-.217-.51V8.682c0-.266.103-.52.287-.704a.976.976 0 0 1 .686-.28h3.718c.278 0 .523.096.731.28.208.183.312.437.312.76v.398c1.175-.223 2.291-.535 3.35-.936a.69.69 0 0 1 .787.09c.37.276.555.714.555 1.315 0 .42-.153.781-.46 1.082-.305.3-.71.45-1.215.45-.356 0-.684-.063-.988-.19a11.22 11.22 0 0 0-2.987 1.723v2.938h2.983a.69.69 0 0 1 .446.182c.128.117.2.28.217.454V18.14c0 .266-.103.52-.287.704a.976.976 0 0 1-.686.28H9.892a.69.69 0 0 1-.686-.28.704.704 0 0 1-.287-.704v-3.313c.857.369 1.687.554 2.49.554 1.956 0 3.536-.673 4.74-2.02.046-.046.085-.096.119-.152V18.14a.67.67 0 0 1-.217.51.69.69 0 0 1-.446.182h-1.162v-2.303c0-.777.22-1.366.66-1.767.44-.4 1.005-.6 1.694-.6.475 0 .88.08 1.216.24.335.16.6.38.8.662.2.282.3.62.3 1.014 0 .266-.05.513-.15.74-.1.227-.26.421-.48.582-.22.16-.527.24-.923.24-.475 0-.85-.123-1.126-.37-.275-.246-.413-.578-.413-.994v-2.287c.776.36 1.457.864 2.043 1.51.586.646 1.01 1.4 1.272 2.26v4.043c0 .12.049.227.147.32.098.093.222.14.372.14h1.064c.148 0 .27-.047.37-.14a.48.48 0 0 0 .147-.32v-2.422c1.146-.1 2.155-.434 3.027-1.004.872-.57 1.54-1.338 2.003-2.298.463-.96.695-2.044.695-3.254 0-1.52-.37-2.89-1.1-4.11a5.41 5.41 0 0 0-2.964-2.676l.818-3.022a.68.68 0 0 1 .267-.396.723.723 0 0 1 .407-.13h3.787c.27 0 .513.09.73.27.217.18.326.433.326.76l.01.914a2.88 2.88 0 0 1-.765 1.992 2.9 2.9 0 0 1-2.063.755 5.4 5.4 0 0 0-1.626.238zm-1.715 3.122a1.038 1.038 0 0 0 .716-.28c.19-.187.285-.43.285-.73 0-.31-.095-.55-.285-.731a.97.97 0 0 0-.716-.28c-.28 0-.513.095-.697.285a.92.92 0 0 0-.284.726c0 .301.094.545.284.73.184.185.418.278.697.278z"/>
  </svg>
);

const SocialIconLinkedIn = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const BrandFooter: React.FC = () => {
  const productLinks = [
    { label: 'Features', to: '/product' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Data Sources', to: '/data-sources' },
    { label: 'Access', to: '/access' },
  ];

  const resourceLinks = [
    { label: 'Documentation', to: '/docs' },
    { label: 'Quick Start', to: '/docs#quickstart' },
    { label: 'Architecture', to: '/docs#architecture' },
    { label: 'API Reference', to: '/docs#api-run' },
    { label: 'Changelog', to: '/docs#changelog' },
  ];

  const companyLinks = [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Use', to: '/terms' },
    { label: 'Security', to: '/security' },
  ];

  const socialLinks: SocialLink[] = [
    { name: 'github',   label: 'Follow us on GitHub',   href: 'https://github.com/tejasbhor/AetherGIS',   icon: SocialIconGithub,   color: '#ffffff' },
    { name: 'x',        label: 'Follow us on X / Twitter', href: 'https://x.com/aethergis',               icon: SocialIconBrandX,  color: '#ffffff' },
    { name: 'discord',  label: 'Join our Discord',      href: 'https://discord.gg/invite/aethergis',   icon: SocialIconDiscord, color: '#7289da' },
    { name: 'bluesky',  label: 'Follow us on Bluesky',  href: 'https://bsky.app/profile/aethergis.bsky.social', icon: SocialIconBluesky, color: '#1e88e5' },
    { name: 'linkedin', label: 'Connect on LinkedIn',   href: 'https://linkedin.com/company/aethergis',  icon: SocialIconLinkedIn, color: '#0a66c2' },
  ];

  return (
    <footer className="brand-site-footer">
      <div className="brand-footer-main">
        <div className="brand-footer-grid">
          {/* Brand Column */}
          <div className="brand-footer-brand">
            <Link to="/" className="brand-footer-logo-link">
              <img
                src="/icon.png"
                alt=""
                className="brand-footer-logo-icon"
              />
              <div className="brand-footer-logo-text">
                <span className="brand-footer-logo-title">AetherGIS</span>
                <span className="brand-footer-logo-subtitle">AI-Based Temporal Enhancement</span>
              </div>
            </Link>
            <p className="brand-footer-tagline">
              See Earth as it truly moves.
            </p>
            <p className="brand-footer-description">
              AI-powered temporal enhancement with accuracy you can trust.
            </p>

            {/* Social Links */}
            <div className="brand-footer-social">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.disabled ? '#' : social.href}
                    target={social.disabled ? undefined : '_blank'}
                    rel={social.disabled ? undefined : 'noopener noreferrer'}
                    className={`brand-footer-social-link ${social.disabled ? 'is-disabled' : ''}`}
                    aria-label={social.label}
                    style={{ '--social-color': social.color } as React.CSSProperties}
                  >
                    <IconComponent className="brand-footer-social-icon" />
                    <span className="brand-footer-social-label">{social.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Column */}
          <div className="brand-footer-column">
            <h4 className="brand-footer-heading">Product</h4>
            <ul className="brand-footer-links">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="brand-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="brand-footer-column">
            <h4 className="brand-footer-heading">Resources</h4>
            <ul className="brand-footer-links">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="brand-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="brand-footer-column">
            <h4 className="brand-footer-heading">Company</h4>
            <ul className="brand-footer-links">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="brand-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="brand-footer-column brand-footer-newsletter">
            <h4 className="brand-footer-heading">Stay Updated</h4>
            <p className="brand-footer-newsletter-text">
              Get the latest updates and announcements.
            </p>
            <form className="brand-footer-form" onSubmit={(e) => e.preventDefault()}>
              <div className="brand-footer-input-wrap">
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email for newsletter"
                  className="brand-footer-input"
                />
                <button type="submit" className="brand-footer-submit">
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="brand-footer-bottom">
        <div className="brand-footer-bottom-inner">
          <span className="brand-footer-copyright">
            © 2026 AetherGIS. All rights reserved.
          </span>
          <nav className="brand-footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/security">Security</Link>
            <Link to="/disclaimer">Disclaimer</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default BrandFooter;