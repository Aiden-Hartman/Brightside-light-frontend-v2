import React from 'react';
import { motion } from 'framer-motion';

const AnalyzingIndicator: React.FC = () => (
  <div className="flex items-center justify-center gap-2 py-2 text-gray-600">
    <span>Analyzing</span>
    <motion.span
      className="inline-block"
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
    >
      .
    </motion.span>
    <motion.span
      className="inline-block"
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', delay: 0.2 }}
    >
      .
    </motion.span>
    <motion.span
      className="inline-block"
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', delay: 0.4 }}
    >
      .
    </motion.span>
  </div>
);

export default AnalyzingIndicator; 