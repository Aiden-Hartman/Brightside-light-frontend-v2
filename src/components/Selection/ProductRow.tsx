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

function sortByPrice(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.price - b.price);
}

const ProductRow: React.FC<ProductRowProps> = ({ products, selectedProductIds, onSelect, onExplainWithAI }) => (
  <div className="grid grid-cols-3 gap-6">
    {sortByPrice(products).map((product, index) => (
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