import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';

interface SummaryDropdownProps {
  selectedProducts: Product[];
  total: number;
  open: boolean;
  onToggle: () => void;
}

const TIER_ORDER = ['good', 'better', 'best'];
function sortByTier(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aIdx = TIER_ORDER.indexOf((a.tier || '').toLowerCase());
    const bIdx = TIER_ORDER.indexOf((b.tier || '').toLowerCase());
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

const SummaryDropdown: React.FC<SummaryDropdownProps> = ({ selectedProducts, total, open, onToggle }) => {
  return (
    <div className="mb-4 rounded-2xl shadow-lg overflow-hidden">
      <button
        className={`w-full flex justify-between items-center px-6 py-4 
                   text-lg font-display bg-gradient-to-r from-dark-green-start to-dark-green-end text-white
                   focus:outline-none transition-all duration-300 border-b border-light-green-start/20`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="category-title">Summary</span>
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
          >
            <div className="px-6 py-4">
              {selectedProducts.length === 0 ? (
                <div className="text-dark-green-start/70 py-4 text-center">No products selected yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {sortByTier(selectedProducts).map((product) => (
                    <div key={product.id} className="flex flex-col items-center glass-panel rounded-xl p-3">
                      <img 
                        src={product.image_url || '/placeholder.png'} 
                        alt={product.title} 
                        className="h-16 w-16 object-contain rounded-lg mb-2"
                      />
                      <div className="font-display text-dark-green-start text-center text-base mb-1">{product.title}</div>
                      <div className="font-body text-orange-cream font-bold text-sm mb-1">${product.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="btn-primary w-full text-lg flex items-center justify-center gap-2"
                disabled={selectedProducts.length === 0}
              >
                Subscribe
                <span className="font-bold">${total.toFixed(2)}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SummaryDropdown; 