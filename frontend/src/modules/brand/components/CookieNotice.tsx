import React, { useEffect, useState } from 'react';

const COOKIE_KEY = 'aethergis_cookie_consent_v1';

const CookieNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(COOKIE_KEY);
    setVisible(!existing);
  }, []);

  const handleChoice = (choice: 'all' | 'essential') => {
    window.localStorage.setItem(COOKIE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="brand-cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use essential cookies for security/session handling and optional analytics cookies to improve the
        product experience.
      </p>
      <div>
        <button className="brand-btn brand-btn-ghost" onClick={() => handleChoice('essential')}>
          Essential Only
        </button>
        <button className="brand-btn brand-btn-primary" onClick={() => handleChoice('all')}>
          Accept All Cookies
        </button>
      </div>
    </div>
  );
};

export default CookieNotice;
