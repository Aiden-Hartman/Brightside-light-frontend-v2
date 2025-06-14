import { Product } from '../types';

export function normalizeProduct(product: Partial<Product>): Product {
  return {
    id: product.id || '',
    title: product.title || 'Untitled',
    image: product.image || '/placeholder.png',
    price: typeof product.price === 'number' ? product.price : 0,
    description: product.description || '',
    tier: product.tier,
    ...product,
  };
}

export function getTotalPrice(products: Product[]): number {
  return products.reduce((sum, p) => sum + (p.price || 0), 0);
} 