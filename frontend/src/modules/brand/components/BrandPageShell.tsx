import React, { useEffect } from 'react';
import Navbar from './Navbar';
import BrandFooter from './BrandFooter';
import CookieNotice from './CookieNotice';

interface BrandPageShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const BrandPageShell: React.FC<BrandPageShellProps> = ({ children, contentClassName }) => {
  useEffect(() => {
    document.documentElement.classList.add('brand-mode');
    document.body.classList.add('brand-mode');
    return () => {
      document.documentElement.classList.remove('brand-mode');
      document.body.classList.remove('brand-mode');
    };
  }, []);

  return (
    <div className="brand-docs-shell">
      <Navbar />
      <main className={contentClassName ?? 'brand-generic-main'}>{children}</main>
      <BrandFooter />
      <CookieNotice />
    </div>
  );
};

export default BrandPageShell;
