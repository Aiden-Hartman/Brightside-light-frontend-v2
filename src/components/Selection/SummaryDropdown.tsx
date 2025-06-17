import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { redirectParent } from '../../lib/redirectParent';

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

    // Debugging and environment variables
    const sellingPlanId = process.env.REACT_APP_SUBSCRIPTION_PLAN_ID;

    console.debug('[DEBUG] Preparing to send subscription message...');
    console.debug('[DEBUG] Selected products:', selectedProducts);
    console.debug('[DEBUG] Selling plan ID:', sellingPlanId);

    if (!selectedProducts || selectedProducts.length === 0) {
      console.warn('[WARNING] No selected products to submit!');
      return;
    }

    const items = selectedProducts.map((product) => ({
      id: product.variant_id,
      quantity: 1,
      selling_plan: sellingPlanId,
    }));

    const validItems = items.filter((item) => !!item.id);
    console.debug('[DEBUG] Mapped items:', items);
    console.debug('[DEBUG] Valid items to submit:', validItems);

    const message = {
      type: 'ADD_SUBSCRIPTION_TO_CART',
      payload: {
        items: validItems,
      },
    };

    console.debug('[DEBUG] Final message object:', message);
    console.debug('[DEBUG] Attempting to send message to parent window...');

    if (window.top) {
      try {
        window.top.postMessage(message, '*');
        console.debug('[DEBUG] Message sent successfully');
      } catch (err) {
        console.error('[ERROR] Failed to send message:', err);
        setError('Failed to add subscription to cart. Please try again.');
      }
    } else {
      console.warn('[WARNING] window.top is null or undefined!');
      setError('Failed to add subscription to cart. Please try again.');
    }

    // Optimistically show loading, then re-enable after 2.5s if not redirected
    setTimeout(() => {
      setIsLoading(false);
      if (!error) {
        setError('Something went wrong adding your bundle. Please try again.');
      }
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
            {/* Add the catalog link at the bottom, always visible */}
            <div className="w-full flex flex-col items-center mt-6 mb-2">
              <span className="text-center text-dark-green-start/80 text-base">
                Can't find what you're looking for?{' '}
                <button
                  type="button"
                  className="inline underline font-medium px-2 py-1 rounded transition hover:bg-orange-cream/10 focus:outline-none focus:ring-2 focus:ring-orange-cream/30"
                  style={{ textDecoration: 'underline', cursor: 'pointer', display: 'inline', background: 'none', border: 'none' }}
                  onClick={() => redirectParent('https://www.brightsidesupplements.com/pages/bundle-builder')}
                >
                  Browse our full catalog here
                </button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SummaryDropdown; 