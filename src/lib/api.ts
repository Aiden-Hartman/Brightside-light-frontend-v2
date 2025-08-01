import { Product, ChatContext, ChatMessage, GPTClassifierResponse, GPTContext } from '../types';
import { AI_PROMPTS } from './constants';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://brightside-light-shopify-assistant.onrender.com/api/v1';

export async function fetchProducts(filters: object, limit: number = 10): Promise<Product[]> {
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
      category: p.category || 'uncategorized',
      variant_id: p.variant_id,
    }));
  } catch (e) {
    return [];
  }
}

export async function askAboutProducts(message: string, context: ChatContext & { answers?: any[] }): Promise<string> {
  console.group('💬 GPT Chat API Call');
  console.log('📝 Message:', message);
  console.log('📦 Context:', {
    productCount: context.products.length,
    productTitles: context.products.map((p: Product) => p.title).join(', '),
    messageCount: context.chatMessages.length
  });

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
    if (!res.ok) {
      console.error('❌ Chat API error:', res.status, res.statusText);
      throw new Error('Failed to get chat response');
    }
    const data = await res.json();
    console.log('✅ Chat response:', data);
    console.groupEnd();
    return data.reply as string;
  } catch (e) {
    console.error('❌ Chat error:', e);
    console.groupEnd();
    throw e;
  }
}

export async function fetchAllProducts(): Promise<Product[]> {
  return fetchProducts({}, 15);
}

export async function classifyGPTMessage(message: string, products: Product[]): Promise<GPTClassifierResponse> {
  console.group('🔍 GPT Classification API Call');
  console.log('📝 Message:', message);
  console.log('📦 Available products:', products.map(p => p.title).join(', '));

  try {
    const body = {
      message,
      products: products.map(p => ({
        title: p.title,
        description: p.description
      }))
    };
    const res = await fetch(`${API_BASE}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('❌ Classification API error:', res.status, res.statusText);
      throw new Error('Failed to classify message');
    }
    const data = await res.json();
    console.log('✅ Classification response:', data);
    console.groupEnd();
    return data as GPTClassifierResponse;
  } catch (e) {
    console.error('❌ Classification error:', e);
    console.groupEnd();
    throw e;
  }
}

export async function respondToGPTMessage(message: string, context: GPTContext): Promise<string> {
  try {
    const body = {
      message,
      context: {
        products: context.products.map(p => ({
          title: p.title,
          description: p.description
        })),
        chatMessages: context.chatMessages
      }
    };
    const res = await fetch(`${API_BASE}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to get GPT response');
    const data = await res.json();
    return data.reply as string;
  } catch (e) {
    console.error('Error getting GPT response:', e);
    return '';
  }
}

// New function for AI comparison that bypasses classification
export async function compareProductsWithAI(products: Product[], chatMessages: ChatMessage[]): Promise<string> {
  console.group('🔍 AI Product Comparison');
  console.log('📦 Products to compare:', products.map(p => p.title).join(', '));
  console.log('💬 Chat messages:', chatMessages.length);

  try {
    const body = {
      message: AI_PROMPTS.COMPARE,
      context: {
        products: products,
        answers: [],
        summary: '',
        chatMessages: chatMessages.slice(-5),
      },
    };
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('❌ Comparison API error:', res.status, res.statusText);
      throw new Error('Failed to get comparison response');
    }
    const data = await res.json();
    console.log('✅ Comparison response received');
    console.groupEnd();
    return data.reply as string;
  } catch (e) {
    console.error('❌ Comparison error:', e);
    console.groupEnd();
    throw e;
  }
}

// New function for AI explanation that bypasses classification
export async function explainProductWithAI(product: Product, chatMessages: ChatMessage[]): Promise<string> {
  console.group('🔍 AI Product Explanation');
  console.log('📦 Product to explain:', product.title);
  console.log('💬 Chat messages:', chatMessages.length);

  try {
    const body = {
      message: AI_PROMPTS.EXPLAIN,
      context: {
        products: [product],
        answers: [],
        summary: '',
        chatMessages: chatMessages.slice(-5),
      },
    };
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('❌ Explanation API error:', res.status, res.statusText);
      throw new Error('Failed to get explanation response');
    }
    const data = await res.json();
    console.log('✅ Explanation response received');
    console.groupEnd();
    return data.reply as string;
  } catch (e) {
    console.error('❌ Explanation error:', e);
    console.groupEnd();
    throw e;
  }
} 