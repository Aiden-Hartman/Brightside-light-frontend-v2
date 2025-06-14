import { Product } from '../types';

const cache: Record<string, Product[]> = {};

export function getCachedProducts(category: string): Product[] | undefined {
  return cache[category];
}

export function setCachedProducts(category: string, products: Product[]): void {
  cache[category] = products;
} 