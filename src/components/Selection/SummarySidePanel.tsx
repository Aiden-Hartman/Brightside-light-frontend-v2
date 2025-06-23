import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { redirectParent } from '../../lib/redirectParent';

interface SummarySidePanelProps {
  selectedProducts: Product[];
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  animatingProductId?: string | null;
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

const PLACEHOLDER_CARD_HEIGHT = 88; // px, adjust to match card height

const SummarySidePanel: React.FC<SummarySidePanelProps> = ({ 
  selectedProducts, 
  total, 
  isOpen, 
  onToggle, 
  onClose, 
  animatingProductId 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [fadeInProductId, setFadeInProductId] = useState<string | null>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for custom event to trigger fade-in after animation
  useEffect(() => {
    function handleAnimationDone(e: CustomEvent) {
      if (e.detail && e.detail.productId) {
        setFadeInProductId(e.detail.productId);
      }
    }
    window.addEventListener('summary-image-animation-done', handleAnimationDone as EventListener);
    return () => window.removeEventListener('summary-image-animation-done', handleAnimationDone as EventListener);
  }, []);

  // Auto-close logic
  useEffect(() => {
    if (isOpen && !isHovering) {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
      autoCloseTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    }
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, [isOpen, isHovering, onClose]);

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
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

  // Helper: get sorted products and placeholder logic
  const sortedProducts = sortByTier(selectedProducts);
  // If animating, insert a placeholder at the correct index
  let displayProducts = sortedProducts;
  let placeholderIndex = -1;
  if (animatingProductId && !fadeInProductId) {
    // Find where the animating product will go
    placeholderIndex = sortedProducts.findIndex(p => p.id === animatingProductId);
    if (placeholderIndex === -1) {
      // If not found, add to end
      placeholderIndex = sortedProducts.length;
    }
    displayProducts = [
      ...sortedProducts.slice(0, placeholderIndex),
      { id: '__placeholder__', title: '', price: 0 },
      ...sortedProducts.slice(placeholderIndex)
    ];
  }

  const selectedCount = selectedProducts.length;

  return (
    <>
      {/* Sticky Tab - Always visible */}
      <motion.button
        className="fixed right-0 top-[20vh] -translate-y-1/2 z-40 bg-gradient-to-r from-dark-green-start to-dark-green-end text-white py-4 px-2 rounded-l-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 md:flex hidden flex-col items-center justify-center w-14 min-h-[120px]"
        onClick={onToggle}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ x: 0 }}
        animate={{ x: isOpen ? -400 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <span
          className="text-sm font-display mb-2"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.1em' }}
        >
          Summary
        </span>
        {selectedCount > 0 && (
          <span className="bg-orange-cream text-dark-green-start text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center mb-2">
            {selectedCount}
          </span>
        )}
        <span
          className="text-lg"
          style={{ transform: 'rotate(90deg)', display: 'inline-block' }}
        >
          ▾
        </span>
      </motion.button>

      {/* Mobile Sticky Tab */}
      <motion.button
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-dark-green-start to-dark-green-end text-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 md:hidden flex"
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 0 }}
        animate={{ y: isOpen ? -400 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-display">Summary</span>
          {selectedCount > 0 && (
            <span className="bg-orange-cream text-dark-green-start text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
              {selectedCount}
            </span>
          )}
          <span
            className="text-lg"
            style={{ transform: 'rotate(90deg)', display: 'inline-block' }}
          >
            ▾
          </span>
        </div>
      </motion.button>

      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* Desktop Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 md:flex hidden flex-col rounded-l-2xl border border-dark-green-start/30"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              data-summary-panel
            >
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-xl text-dark-green-start">Your Selection</h2>
                    <button
                      onClick={onClose}
                      className="text-dark-green-start/70 hover:text-dark-green-start transition-colors"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>
                  {displayProducts.length === 0 ? (
                    <div className="text-dark-green-start/70 py-8 text-center">
                      No products selected yet.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {displayProducts.map((product, idx) => (
                          product.id === '__placeholder__' ? (
                            <div
                              key="placeholder"
                              style={{ height: PLACEHOLDER_CARD_HEIGHT, background: 'transparent' }}
                              className="rounded-xl"
                            />
                          ) : (
                            <AnimatePresence key={product.id}>
                              {(fadeInProductId === product.id || !animatingProductId) && (
                                <motion.div
                                  className="flex items-center gap-4 glass-panel rounded-xl p-4"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
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
                              )}
                            </AnimatePresence>
                          )
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
            </motion.div>

            {/* Mobile Panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden flex flex-col max-h-[80vh] border border-dark-green-start/30"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              data-summary-panel
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-xl text-dark-green-start">Your Selection</h2>
                  <button
                    onClick={onClose}
                    className="text-dark-green-start/70 hover:text-dark-green-start transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                {displayProducts.length === 0 ? (
                  <div className="text-dark-green-start/70 py-8 text-center">
                    No products selected yet.
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {displayProducts.map((product, idx) => (
                        product.id === '__placeholder__' ? (
                          <div
                            key="placeholder"
                            style={{ height: PLACEHOLDER_CARD_HEIGHT, background: 'transparent' }}
                            className="rounded-xl"
                          />
                        ) : (
                          <AnimatePresence key={product.id}>
                            {(fadeInProductId === product.id || !animatingProductId) && (
                              <motion.div
                                className="flex items-center gap-4 glass-panel rounded-xl p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
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
                            )}
                          </AnimatePresence>
                        )
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

              {/* Catalog Link */}
              <div className="px-6 pb-6 border-t border-light-green-start/20">
                <div className="text-center text-dark-green-start/80 text-sm pt-4">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SummarySidePanel; 