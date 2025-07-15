export interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  image_url?: string;
  category?: string;
  variant_id?: number;
  [key: string]: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  products: Product[];
  summary: string;
  chatMessages: ChatMessage[];
}

export interface GPTClassifierResponse {
  status: 'ok' | 'fallback';
  required_context: string[];  // Product titles
}

export interface GPTContext {
  products: Product[];
  chatMessages: ChatMessage[];
} 