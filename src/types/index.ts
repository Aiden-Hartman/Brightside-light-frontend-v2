export interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  image_url?: string;
  tier?: string;
  category?: string;
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