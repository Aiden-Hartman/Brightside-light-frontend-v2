import React, { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;
const LOCALSTORAGE_KEY = 'hideMobileWarning';

const MobileWarning: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const hidden = localStorage.getItem(LOCALSTORAGE_KEY) === 'true';
    setHideBanner(hidden);
  }, []);

  const handleClose = () => {
    setHideBanner(true);
    localStorage.setItem(LOCALSTORAGE_KEY, 'true');
  };

  if (!isMobile || hideBanner) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-xl z-50 bg-[#fdf6e3] text-[#527055] px-6 py-5 flex items-center justify-between shadow-lg rounded-2xl border border-[#eee]" style={{fontFamily: 'acumin-pro, sans-serif'}}>
      <div className="flex items-center gap-4">
        <span className="text-4xl" aria-label="Warning">⚠️</span>
        <p className="text-lg font-body leading-snug">
          This experience is not optimized for mobile. Please use a desktop for best results.
        </p>
      </div>
      <button
        onClick={handleClose}
        className="ml-4 text-3xl font-bold text-[#527055] hover:text-[#678969] transition-colors focus:outline-none"
        aria-label="Close warning"
        style={{lineHeight: 1}}
      >
        ×
      </button>
    </div>
  );
};

export default MobileWarning; 
export default MobileWarning; 