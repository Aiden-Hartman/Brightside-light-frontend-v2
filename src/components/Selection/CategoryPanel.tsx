import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryPanelProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  bannerColor?: 'main-green' | 'default';
  onPanelOpenComplete?: () => void;
  [key: string]: any; // Allow extra props
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({ title, open, onToggle, children, bannerColor = 'default', onPanelOpenComplete, ...rest }) => (
  <div className="mb-4 rounded-2xl shadow-lg overflow-hidden" {...rest}>
    <button
      className={`w-full flex justify-between items-center px-6 py-4 
                 text-lg font-display
                 focus:outline-none transition-all duration-300
                 ${open ? (bannerColor === 'main-green' ? 'bg-gradient-to-r from-dark-green-start to-dark-green-end text-white' : 'bg-white text-dark-green-start') : (bannerColor === 'main-green' ? 'bg-gradient-to-r from-dark-green-start to-dark-green-end text-white/90' : 'bg-white/90 text-dark-green-start')}
                 border-b border-light-green-start/20`}
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className="category-title">{title}</span>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="text-white text-2xl"
      >
        ▾
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="overflow-hidden bg-white"
          onAnimationComplete={() => { if (onPanelOpenComplete) onPanelOpenComplete(); }}
        >
          <div className="px-6 py-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default CategoryPanel; 