import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';

interface SummaryPanelProps {
  selectedProducts: Product[];
  total: number;
  children?: React.ReactNode;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ selectedProducts, total, children }) => (
  <motion.div
    className="summary-bar"
    initial={{ y: 100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="max-w-[900px] mx-auto px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-dark-green-start">Your Selection</h2>
        <motion.span
          className="font-body text-2xl font-bold text-orange-cream"
          key={total}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          ${total.toFixed(2)}
        </motion.span>
      </div>

      <div className="flex flex-wrap gap-4">
        <AnimatePresence>
          {selectedProducts.map((product) => (
            <motion.div
              key={product.id}
              className="flex items-center gap-3 glass-panel rounded-xl p-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <img 
                src={product.image_url || '/placeholder.png'} 
                alt={product.title} 
                className="h-12 w-12 object-contain rounded-lg"
              />
              <div>
                <div className="font-display text-dark-green-start">{product.title}</div>
                <div className="font-body text-orange-cream font-bold">
                  ${product.price.toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {children && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  </motion.div>
);

export default SummaryPanel; 