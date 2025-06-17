import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileWarning: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsVisible(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-cream text-white p-4 shadow-lg"
        >
          <div className="max-w-[900px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="warning" className="text-xl">⚠️</span>
              <p className="font-body">
                This page is not optimized for mobile devices. For the best experience, please visit on a desktop computer.
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close warning"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileWarning; 