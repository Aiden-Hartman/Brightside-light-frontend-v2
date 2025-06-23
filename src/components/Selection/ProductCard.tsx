import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onExplainWithAI?: (product: Product) => void;
}

const shimmerKeyframes = {
  shimmer: {
    background: 'linear-gradient(90deg, rgba(255,223,120,0.2) 0%, rgba(255,223,120,0.7) 50%, rgba(255,223,120,0.2) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
};

const ProductCard: React.FC<ProductCardProps> = ({ product, selected, onSelect, onExplainWithAI }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiButtonVisible, setAIButtonVisible] = useState(false);
  const aiTimeout = useRef<NodeJS.Timeout | null>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  // Check if the description is clamped after 2 lines
  useEffect(() => {
    if (descRef.current && !expanded) {
      const el = descRef.current;
      setIsClamped(el.scrollHeight > el.clientHeight + 1); // +1 for rounding
    } else {
      setIsClamped(false);
    }
  }, [product.description, expanded]);

  // Handlers for AI button UX
  const handleMouseEnter = () => {
    if (aiTimeout.current) clearTimeout(aiTimeout.current);
    setShowAI(true);
    setAIButtonVisible(true);
  };
  const handleMouseLeave = () => {
    aiTimeout.current = setTimeout(() => {
      setAIButtonVisible(false);
      setShowAI(false);
    }, 200);
  };
  const handleAIButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAIButtonVisible(false);
    setTimeout(() => setShowAI(false), 400);
    if (onExplainWithAI) onExplainWithAI(product);
  };

  // Touch support
  const handleTouchStart = () => {
    setShowAI(true);
    setAIButtonVisible(true);
  };
  const handleTouchEnd = () => {
    setTimeout(() => {
      setAIButtonVisible(false);
      setShowAI(false);
    }, 400);
  };

  return (
    <motion.div
      className={`product-card relative group cursor-pointer ${selected ? 'ring-2 ring-orange-cream' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`${product.title} - ${product.price.toFixed(2)}`}
      data-product-id={product.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* AI Explanation Button - now top left */}
      {showAI && (
        <motion.button
          className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-white/90 shadow-lg flex items-center gap-2 text-sm font-semibold text-orange-cream border border-orange-cream z-20"
          style={{ pointerEvents: aiButtonVisible ? 'auto' : 'none', opacity: aiButtonVisible ? 1 : 0, transition: 'opacity 0.4s' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: aiButtonVisible ? 1 : 0.95, y: aiButtonVisible ? 0 : -5 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={handleAIButtonClick}
          tabIndex={-1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <span role="img" aria-label="sparkle" className="animate-pulse">✨</span>
          <span className="shimmer-text">Explain with AI</span>
        </motion.button>
      )}
      <div className="relative">
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.title}
          className="h-32 w-full object-contain mb-4 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.tier && (
          <motion.span
            className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1
              ${product.tier.toLowerCase() === 'good' ? 'bg-green-200 text-dark-green-start border border-green-400 shadow-sm' : ''}
              ${product.tier.toLowerCase() === 'better' ? 'bg-orange-200 text-orange-cream border border-orange-300 shadow-md' : ''}
              ${product.tier.toLowerCase() === 'best' ? 'bg-yellow-200 text-yellow-900 border border-yellow-400 shadow-lg' : ''}
            `}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {product.tier.toLowerCase() === 'good' && <span role="img" aria-label="good" className="">👍</span>}
            {product.tier.toLowerCase() === 'better' && <span role="img" aria-label="better" className="">🚀</span>}
            {product.tier.toLowerCase() === 'best' && <span role="img" aria-label="best" className="">🏆</span>}
            {product.tier.charAt(0).toUpperCase() + product.tier.slice(1)}
          </motion.span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-dark-green-start text-lg">{product.title}</h3>
          <span className="font-body font-bold text-orange-cream text-lg">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <div className="text-dark-green-start/70 text-sm min-h-[40px]">
          {!expanded ? (
            <>
              <div
                ref={descRef}
                className="line-clamp-2 overflow-hidden"
                style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
              >
                {product.description}
              </div>
              {isClamped && (
                <span className="underline cursor-pointer ml-1 text-xs align-baseline" onClick={e => { e.stopPropagation(); setExpanded(true); }}>see more</span>
              )}
            </>
          ) : (
            <>
              <div>{product.description}</div>
              <span className="underline cursor-pointer ml-1 text-xs align-baseline" onClick={e => { e.stopPropagation(); setExpanded(false); }}>see less</span>
            </>
          )}
        </div>
      </div>
      {selected && (
        <motion.div
          className="absolute inset-0 bg-orange-cream/5 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #ffe082 0%, #f6bb6b 50%, #ffe082 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default ProductCard; 