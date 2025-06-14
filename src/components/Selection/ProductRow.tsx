import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { Product } from '../../types';

interface ProductRowProps {
  products: Product[];
  selectedProductIds: string[];
  onSelect: (productId: string) => void;
  onExplainWithAI?: (product: Product) => void;
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

const ProductRow: React.FC<ProductRowProps> = ({ products, selectedProductIds, onSelect, onExplainWithAI }) => (
  <div className="grid grid-cols-3 gap-6">
    {sortByTier(products).map((product, index) => (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.4,
          delay: index * 0.1,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <ProductCard
          product={product}
          selected={selectedProductIds.includes(product.id)}
          onSelect={() => onSelect(product.id)}
          onExplainWithAI={onExplainWithAI}
        />
      </motion.div>
    ))}
  </div>
);

export default ProductRow; 