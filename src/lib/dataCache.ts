import { Product } from '../types';

const cache: Record<string, Product[]> = {};
let gptAllProductsCache: Product[] | null = null;

export function getCachedProducts(category: string): Product[] | undefined {
  return cache[category];
}

export function setCachedProducts(category: string, products: Product[]): void {
  cache[category] = products;
}

export function getGPTAllProductsCache(): Product[] | null {
  return gptAllProductsCache;
}

export function setGPTAllProductsCache(products: Product[]): void {
  gptAllProductsCache = products;
} 