import React, { useEffect } from 'react';
import { useSystemConfig } from '@shared/api/client';
import EarthScrollScene from './components/EarthScrollScene';
import Navbar from './components/Navbar';
import BrandFooter from './components/BrandFooter';
import CookieNotice from './components/CookieNotice';
import './Brand.css';

const LandingPage: React.FC = () => {
  const { data: config } = useSystemConfig();

  useEffect(() => {
    document.documentElement.classList.add('brand-mode');
    document.body.classList.add('brand-mode');
    return () => {
      document.documentElement.classList.remove('brand-mode');
      document.body.classList.remove('brand-mode');
    };
  }, []);

  const handleEnterDashboard = () => {
    if (config?.mode === 'production' || config?.is_dev_preview) {
      window.location.href = '/api/v1/auth/login';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="brand-shell">
      <Navbar />
      <EarthScrollScene onEnterDashboard={handleEnterDashboard} />
      <BrandFooter />
      <CookieNotice />
    </div>
  );
};

export default LandingPage;
