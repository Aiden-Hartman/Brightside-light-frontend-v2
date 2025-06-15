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

const ALLOWED_ORIGIN = "https://brightside-light-frontend-v2.vercel.app";

const SummaryDropdown: React.FC<SummaryDropdownProps> = ({ selectedProducts, total, open, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = () => {
    if (selectedProducts.length === 0) return;
    setIsLoading(true);
    setError(null);

    // Build items array, filtering out invalid entries
    const sellingPlanId = process.env.NEXT_PUBLIC_SUBSCRIPTION_PLAN_ID;
    const items = selectedProducts
      .filter(product => product.variant_id && sellingPlanId)
      .map(product => ({
        id: product.variant_id,
        quantity: 1,
        selling_plan: sellingPlanId
      }));

    if (items.length === 0) {
      setError('No valid products to subscribe.');
      setIsLoading(false);
      return;
    }

    // Send postMessage to parent window
    try {
      if (window.top) {
        window.top.postMessage({
          type: "ADD_SUBSCRIPTION_TO_CART",
          payload: { items }
        }, ALLOWED_ORIGIN);
      } else {
        setError('Unable to communicate with parent window.');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError('Failed to send subscription request.');
      setIsLoading(false);
      return;
    }

    // Optimistically show loading, then re-enable after 2.5s if not redirected
    setTimeout(() => {
      setIsLoading(false);
      setError('Something went wrong adding your bundle. Please try again.');
    }, 2500);
  };

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
      <AnimatePresence>
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
                <>
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
                  {error && (
                    <div className="text-red-500 text-center mb-4">{error}</div>
                  )}
                  <button
                    className="btn-primary w-full text-lg flex items-center justify-center gap-2"
                    disabled={selectedProducts.length === 0 || isLoading}
                    onClick={handleSubscribe}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe
                        <span className="font-bold">${total.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SummaryDropdown; 