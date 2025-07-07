import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { redirectParent } from '../../lib/redirectParent';

interface SummarySidePanelProps {
  selectedProducts: Product[];
  total: number;
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

const IMAGE_ANIMATION_DURATION = 1000; // ms, matches Framer Motion duration

const SummarySidePanel: React.FC<SummarySidePanelProps> = ({ 
  selectedProducts, 
  total
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect when a new product is added
  useEffect(() => {
    if (selectedProducts.length === 0) return;
    const lastProduct = selectedProducts[selectedProducts.length - 1];
    if (lastProduct && lastProduct.id !== justAddedId) {
      setJustAddedId(lastProduct.id);
      setShowInfo(false);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setShowInfo(true);
      }, IMAGE_ANIMATION_DURATION);
    }
  }, [selectedProducts]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const handleSubscribe = () => {
    if (selectedProducts.length === 0) return;
    setIsLoading(true);
    setError(null);
    const sellingPlanId = process.env.REACT_APP_SUBSCRIPTION_PLAN_ID;
    if (!selectedProducts || selectedProducts.length === 0) return;
    const items = selectedProducts.map((product) => ({
      id: product.variant_id,
      quantity: 1,
      selling_plan: sellingPlanId,
    }));
    const validItems = items.filter((item) => !!item.id);
    const message = {
      type: 'ADD_SUBSCRIPTION_TO_CART',
      payload: { items: validItems },
    };
    if (window.top) {
      try {
        window.top.postMessage(message, '*');
      } catch (err) {
        setError('Failed to add subscription to cart. Please try again.');
      }
    } else {
      setError('Failed to add subscription to cart. Please try again.');
    }
    setTimeout(() => {
      setIsLoading(false);
      if (!error) {
        setError('Something went wrong adding your bundle. Please try again.');
      }
    }, 2500);
  };

  const selectedCount = selectedProducts.length;

  return (
    <aside className="w-96 h-full flex flex-col z-30 bg-white shadow-2xl rounded-l-2xl border border-dark-green-start/30" style={{ minHeight: '100vh' }} data-summary-panel>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl text-dark-green-start">Your Selection</h2>
          </div>
          {selectedProducts.length === 0 ? (
            <div className="text-dark-green-start/70 py-8 text-center">
              No products selected yet.
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {selectedProducts.map((product) => {
                  const isJustAdded = product.id === justAddedId;
                  if (isJustAdded && !showInfo) {
                    return <div style={{ height: '4rem' }} key={`placeholder-${product.id}`} />;
                  }
                  return (
                    <motion.div
                      key={product.id}
                      className="flex items-center gap-4 glass-panel rounded-xl p-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      data-product-id={product.id}
                    >
                      <img 
                        src={product.image_url || '/placeholder.png'} 
                        alt={product.title} 
                        className="h-16 w-16 object-contain rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-dark-green-start text-base mb-1 truncate">
                          {product.title}
                        </div>
                        <div className="font-body text-orange-cream font-bold text-sm">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
      </div>
      {/* Catalog Link */}
      <div className="p-6 border-t border-light-green-start/20">
        <div className="text-center text-dark-green-start/80 text-sm">
          Can't find what you're looking for?{' '}
          <button
            type="button"
            className="inline underline font-medium px-2 py-1 rounded transition hover:bg-orange-cream/10 focus:outline-none focus:ring-2 focus:ring-orange-cream/30"
            style={{ textDecoration: 'underline', cursor: 'pointer', display: 'inline', background: 'none', border: 'none' }}
            onClick={() => redirectParent('https://www.brightsidesupplements.com/pages/bundle-builder')}
          >
            Browse our full catalog here
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SummarySidePanel; 