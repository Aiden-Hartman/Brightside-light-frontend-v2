import { Product, ChatContext, ChatMessage } from '../types';

const API_BASE = 'https://brightside-light-shopify-assistant.onrender.com/api/v1';

export async function fetchProducts(filters: object, limit: number = 3): Promise<Product[]> {
  try {
    const body = { filters, limit };
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    // Map backend fields to Product type
    return (data.products || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description || 'No description available',
      image_url: p.image_url || '',
      tier: p.tier || 'unspecified',
      category: p.category || 'uncategorized',
    }));
  } catch (e) {
    return [];
  }
}

export async function askAboutProducts(message: string, context: ChatContext & { answers?: any[] }): Promise<string> {
  try {
    const body = {
      message,
      context: {
        products: context.products,
        answers: context.answers || [],
        summary: context.summary || '',
        chatMessages: (context.chatMessages || []).slice(-5),
      },
    };
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to get chat reply');
    const data = await res.json();
    return data.reply as string;
  } catch (e) {
    return '';
  }
} 