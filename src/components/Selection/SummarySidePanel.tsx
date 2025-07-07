import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { redirectParent } from '../../lib/redirectParent';

interface SummarySidePanelProps {
  selectedProducts: Product[];
  total: number;
  lastSelectedProductId?: string;
  lastSelectedProductCatKey?: string;
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
  total,
  lastSelectedProductId,
  lastSelectedProductCatKey
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnimatedId = useRef<string | null>(null);

  // Detect when a new product is added
  useEffect(() => {
    if (selectedProducts.length === 0) return;
    const lastProduct = selectedProducts[selectedProducts.length - 1];
    if (lastProduct && lastProduct.id !== justAddedId) {
      console.log('[ANIMATION DEBUG] Setting justAddedId:', lastProduct.id, 'Previous justAddedId:', justAddedId);
      setJustAddedId(lastProduct.id);
      setShowInfo(false);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        console.log('[ANIMATION DEBUG] Setting showInfo: true for justAddedId:', lastProduct.id);
        setShowInfo(true);
      }, IMAGE_ANIMATION_DURATION);
    }
  }, [selectedProducts]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    console.log('[ANIMATION DEBUG] Animation useEffect triggered', {
      justAddedId,
      showInfo,
      lastSelectedProductId,
      lastSelectedProductCatKey,
      selectedProducts: selectedProducts.map(p => p.id),
      effectRunTime: Date.now(),
      location: window.location.pathname
    });
    // Only run if a new product was just added and showInfo is true, and not already animated for this id
    if (
      justAddedId &&
      showInfo &&
      lastSelectedProductId &&
      lastSelectedProductCatKey &&
      justAddedId !== lastAnimatedId.current
    ) {
      console.log('[ANIMATION DEBUG] Animation effect condition met', {
        justAddedId,
        showInfo,
        lastSelectedProductId,
        lastSelectedProductCatKey,
        selectedProducts: selectedProducts.map(p => p.id)
      });
      // Try to find the source card in the main content
      const sourceCard = document.querySelector(`[data-product-id="${lastSelectedProductId}"]`);
      // Try to find the target card in the summary panel
      const summaryPanel = document.querySelector('[data-summary-panel]');
      if (!sourceCard) {
        console.log('[ANIMATION DEBUG] (SummarySidePanel) sourceCard not found for', lastSelectedProductId);
        return;
      }
      if (!summaryPanel) {
        console.log('[ANIMATION DEBUG] (SummarySidePanel) summaryPanel not found');
        return;
      }
      // Find the target product card in the summary panel
      const productCards = summaryPanel.querySelectorAll('.glass-panel[data-product-id]');
      const targetIndex = selectedProducts.findIndex(p => p.id === lastSelectedProductId);
      const targetProductCard = productCards[targetIndex];
      if (!targetProductCard) {
        console.log('[ANIMATION DEBUG] (SummarySidePanel) targetProductCard not found for targetIndex', targetIndex, 'selectedProducts', selectedProducts, 'productCards.length', productCards.length);
        return;
      }
      console.log('[ANIMATION DEBUG] (SummarySidePanel) Animating from sourceCard to targetProductCard', { lastSelectedProductId, targetIndex });
      import('../../lib/animateProductImage').then(({ animateProductImage }) => {
        animateProductImage(sourceCard as HTMLElement, targetProductCard as HTMLElement);
        // After animation, reset justAddedId so this only runs once per selection
        setJustAddedId(null);
        setShowInfo(false);
        lastAnimatedId.current = justAddedId;
        console.log('[ANIMATION DEBUG] Reset justAddedId and showInfo after animation, set lastAnimatedId:', justAddedId);
      });
    }
  }, [justAddedId, showInfo, lastSelectedProductId, lastSelectedProductCatKey, selectedProducts]);

  // Also, reset lastAnimatedId.current when openSection/category changes (if you pass openSection as a prop, or use lastSelectedProductCatKey)
  useEffect(() => {
    lastAnimatedId.current = null;
  }, [lastSelectedProductCatKey]);

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
    </aside>
  );
};

export default SummarySidePanel;